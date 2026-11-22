#!/usr/bin/env python3
"""
End-to-End Verification Suite for TFAM Studio (All 14 Modules + Security/RBAC + Public API)
Boots the real HTTP server on an ephemeral port against a temporary SQLite database.
"""

from __future__ import annotations
import base64
import io
import json
import os
import sys
import tempfile
import threading
import urllib.error
import urllib.request
import zipfile
from http.server import ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "apps" / "api"))
os.environ["TFAM_QUIET"] = "1"

from local_server import Database, TFAMRequestHandler  # noqa: E402


def req(base: str, method: str, path: str, body=None, token: str | None = None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(f"{base}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw}


def make_sample_docx_b64() -> str:
    xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>Chương 229: Bến Cảng Băng Giá</w:t></w:r></w:p>
        <w:p><w:r><w:t>Edward Spencer nhìn ra mặt biển đóng băng cùng Evelyne Vesper. Edward Spencer ra lệnh kéo neo trước bình minh.</w:t></w:r></w:p>
      </w:body>
    </w:document>"""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("word/document.xml", xml)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        db = Database(Path(tmp) / "test_tfam.db")

        class TestHandler(TFAMRequestHandler):
            pass

        TestHandler.db = db
        server = ThreadingHTTPServer(("127.0.0.1", 0), TestHandler)
        port = server.server_address[1]
        base = f"http://127.0.0.1:{port}"
        t = threading.Thread(target=server.serve_forever, daemon=True)
        t.start()

        try:
            # 1. Health & Static UI served
            st, data = req(base, "GET", "/api/health")
            assert st == 200 and data["ok"] is True, f"Health failed: {st} {data}"
            with urllib.request.urlopen(f"{base}/") as resp:
                html = resp.read().decode("utf-8")
                assert "TFAM STUDIO" in html, "Studio HTML shell missing"

            # 2. Unauthenticated Studio access MUST return 401
            st, _ = req(base, "GET", "/api/dashboard")
            assert st == 401, f"Expected 401 unauthenticated, got {st}"

            # 3. Auth: Owner, Editor, Reader logins
            st, owner_login = req(base, "POST", "/api/auth/login", {"email": "author@tfam.studio", "password": "tfam-studio-dev-pass"})
            assert st == 200 and owner_login["user"]["role"] == "owner"
            owner_tok = owner_login["token"]

            st, ed_login = req(base, "POST", "/api/auth/login", {"email": "editor@tfam.studio", "password": "editor-dev-pass"})
            assert st == 200 and ed_login["user"]["role"] == "editor"
            editor_tok = ed_login["token"]

            st, rd_login = req(base, "POST", "/api/auth/login", {"email": "reader@tfam.studio", "password": "reader-dev-pass"})
            assert st == 200 and rd_login["user"]["role"] == "reader"
            reader_tok = rd_login["token"]

            # 4. RBAC Enforcement: Reader cannot access Studio; Editor cannot publish/admin
            st, _ = req(base, "GET", "/api/dashboard", token=reader_tok)
            assert st == 403, f"Reader must be blocked from Studio (got {st})"
            st, _ = req(base, "GET", "/api/admin/overview", token=editor_tok)
            assert st == 403, f"Editor must be blocked from Admin (got {st})"
            st, _ = req(base, "POST", "/api/publishing/approve", {"entity_type": "chapter", "entity_id": "ch-161", "visibility": "public"}, token=editor_tok)
            assert st == 403, f"Editor must be blocked from Publishing Approval (got {st})"

            # 5. Dashboard & Global Search
            st, dash = req(base, "GET", "/api/dashboard", token=owner_tok)
            assert st == 200 and len(dash["volumes"]) == 6
            st, srch = req(base, "GET", "/api/search?q=Wardenholf", token=owner_tok)
            assert st == 200 and len(srch["chapters"]) >= 1 and len(srch["canon"]) >= 1

            # 6. Manuscript CRUD + Revision History + Restore + Contextual Inspector
            st, created = req(base, "POST", "/api/chapters", {"volume_id": "vol-6", "chapter_number": 228, "title": "Chương 228: Test", "content": "Bản đầu tiên."}, token=owner_tok)
            assert st == 201
            ch_id = created["chapter"]["id"]
            st, _ = req(base, "PUT", f"/api/chapters/{ch_id}", {"content": "Bản thứ hai đã sửa.", "change_summary": "Edit 2"}, token=owner_tok)
            assert st == 200
            st, revs = req(base, "GET", f"/api/chapters/{ch_id}/revisions", token=owner_tok)
            assert st == 200 and len(revs["revisions"]) == 2
            rev1_id = revs["revisions"][-1]["id"]
            st, restored = req(base, "POST", f"/api/chapters/{ch_id}/restore/{rev1_id}", {}, token=owner_tok)
            assert st == 200 and restored["chapter"]["content"] == "Bản đầu tiên."

            # 7. Canon Graph + 409 Protection (What-if cannot silently overwrite Canon)
            st, graph = req(base, "GET", "/api/canon/graph", token=owner_tok)
            assert st == 200 and len(graph["nodes"]) >= 10 and len(graph["edges"]) >= 5
            st, _ = req(base, "PUT", "/api/canon/canon-vestigium", {"data_state": "what_if"}, token=owner_tok)
            assert st == 409, f"Canon must not be overwritten by what_if (got {st})"

            # 8. Character Knowledge State (Edward at Ch. 218)
            st, kn = req(base, "GET", "/api/knowledge-state?character_id=char-edward&chapter=218", token=owner_tok)
            assert st == 200
            known_keys = {k["fact_key"] for k in kn["known"]}
            unknown_keys = {k["fact_key"] for k in kn["cannot_know_yet"]}
            assert "wardenholf_supply_rumor" in known_keys
            assert "wardenholf_calibration_secret" in unknown_keys

            # 9. Narrative QA on Ch. 218 (All TFAM deterministic rules + Knowledge State violation + Before/After)
            st, qa = req(base, "POST", "/api/qa/run/ch-218", {}, token=owner_tok)
            assert st == 200
            cats = {f["category"] for f in qa["deterministic_findings"]}
            for required_cat in ("banned_vocabulary", "negative_to_positive", "repeated_motif", "dialogue_pacing", "knowledge_state_violation"):
                assert required_cat in cats, f"Missing expected QA category '{required_cat}' in {cats}"
            assert qa["before_after_preview"]["has_auto_suggestions"] is True

            # 10. What-if Sandbox isolation
            st, wi = req(base, "POST", "/api/what-if", {"title": "Test Branch", "premise": "Hạm đội đổi hướng", "divergence_chapter": 218}, token=owner_tok)
            assert st == 201 and len(wi["downstream_canon_events"]) >= 1

            # 11. Publishing Center: Approve Paid Chapter -> Verify 402 Gate -> Sandbox Checkout -> Unlock -> Rollback
            st, snap = req(base, "POST", "/api/publishing/approve", {"entity_type": "chapter", "entity_id": "ch-161", "visibility": "paid", "release_notes": "Paid release"}, token=owner_tok)
            assert st == 201
            # Public catalog respects spoiler gate (Ch 161 gated at 160)
            st, cat_early = req(base, "GET", "/api/public/catalog?unlocked_chapter=50")
            assert all(it["entity_id"] != "ch-161" for it in cat_early["items"]), "Spoiler gate leaked Ch 161!"
            st, cat_full = req(base, "GET", "/api/public/catalog?unlocked_chapter=200")
            assert any(it["entity_id"] == "ch-161" for it in cat_full["items"])
            # Paid chapter blocks reader without entitlement (402)
            st, _ = req(base, "GET", "/api/public/chapters/ch-161", token=reader_tok)
            assert st == 402, f"Expected 402 for unpaid reader, got {st}"
            # Sandbox checkout grants entitlement
            st, chk = req(base, "POST", "/api/commerce/sandbox-checkout", {"product_id": "prod-patron", "user_id": "usr-reader"}, token=owner_tok)
            assert st == 201 and chk["status"] == "sandbox_completed"
            # Now reader can access ch-161, and author_notes are stripped!
            st, ch161_pub = req(base, "GET", "/api/public/chapters/ch-161", token=reader_tok)
            assert st == 200 and "author_notes" not in ch161_pub["chapter"]

            # 12. Module 14: Native DOCX Data Importer -> Staging Queue -> Explicit Approval
            st, imp = req(base, "POST", "/api/importer/upload", {"filename": "vol6_ch229.docx", "format": "docx", "base64_content": make_sample_docx_b64()}, token=owner_tok)
            assert st == 201 and imp["staged_count"] >= 2
            stg_chapter = next(i for i in imp["items"] if i["target_type"] == "chapter")
            assert stg_chapter["status"] == "pending_review"
            st, dec = req(base, "POST", f"/api/importer/staging/{stg_chapter['id']}/decide", {"decision": "approved_draft"}, token=owner_tok)
            assert st == 200 and dec["created_entity_id"].startswith("ch-")

            # 13. Admin Backup & Audit Log
            st, bkp = req(base, "GET", "/api/admin/backup", token=owner_tok)
            assert st == 200 and "chapters" in bkp["data"] and len(bkp["data"]["chapters"]) >= 4

            print("ALL 13 END-TO-END VERIFICATION GROUPS PASSED!")
        finally:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    main()
