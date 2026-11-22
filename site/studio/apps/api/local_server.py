#!/usr/bin/env python3
"""
TFAM Studio — Local Full-Stack Server & Shared REST API
Zero external dependencies (Python 3.11+ stdlib + native SQLite 3).
Serves:
  - /api/*        -> Authenticated Studio API (14 modules) + Public Read-Only API (/api/public/*)
  - /*            -> TFAM Studio Editorial Web Application (apps/studio/)

Run locally:
  python3 apps/api/local_server.py --port 8787
"""

from __future__ import annotations
import argparse
import hashlib
import hmac
import json
import mimetypes
import os
import secrets
import sqlite3
import sys
import urllib.parse
import uuid
from datetime import datetime, timedelta, timezone
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

API_DIR = Path(__file__).resolve().parent
ROOT_DIR = API_DIR.parent.parent
STUDIO_DIR = ROOT_DIR / "apps" / "studio"
MIGRATIONS_DIR = ROOT_DIR / "database" / "migrations"
SEEDS_DIR = ROOT_DIR / "database" / "seeds"

sys.path.insert(0, str(API_DIR))
from qa_engine import run_deterministic_qa  # noqa: E402
from importer import parse_import_payload  # noqa: E402


SESSION_SECRET = os.environ.get("TFAM_SESSION_SECRET", "tfam-local-dev-secret-change-in-prod")
DEFAULT_DB_PATH = Path(os.environ.get("TFAM_DB_PATH", str(ROOT_DIR / "data" / "tfam_studio.db")))


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    salt_val = salt or secrets.token_hex(16)
    dk = hashlib.scrypt(password.encode("utf-8"), salt=salt_val.encode("utf-8"), n=16384, r=8, p=1)
    return dk.hex(), salt_val


def verify_password(password: str, expected_hash: str, salt: str) -> bool:
    actual_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(actual_hash, expected_hash)


def hash_token(token: str) -> str:
    return hmac.new(SESSION_SECRET.encode("utf-8"), token.encode("utf-8"), hashlib.sha256).hexdigest()


class Database:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    def connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=15)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA journal_mode = WAL;")
        return conn

    def init_db(self) -> None:
        conn = self.connect()
        try:
            for sql_file in sorted(MIGRATIONS_DIR.glob("*.sql")):
                conn.executescript(sql_file.read_text(encoding="utf-8"))
            # Bootstrap default users if none exist
            user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            if user_count == 0:
                owner_email = os.environ.get("TFAM_OWNER_EMAIL", "author@tfam.studio")
                owner_pass = os.environ.get("TFAM_OWNER_PASSWORD", "tfam-studio-dev-pass")
                owner_hash, owner_salt = hash_password(owner_pass)
                ed_hash, ed_salt = hash_password("editor-dev-pass")
                rd_hash, rd_salt = hash_password("reader-dev-pass")
                conn.executemany(
                    "INSERT INTO users (id, email, display_name, role, password_hash, password_salt) VALUES (?, ?, ?, ?, ?, ?)",
                    [
                        ("usr-owner", owner_email, "Leonardo Ravenna (Owner)", "owner", owner_hash, owner_salt),
                        ("usr-editor", "editor@tfam.studio", "TFAM Co-Editor", "editor", ed_hash, ed_salt),
                        ("usr-reader", "reader@tfam.studio", "Verified Reader", "reader", rd_hash, rd_salt),
                    ],
                )
            # Seed canonical TFAM data if volumes table is empty
            vol_count = conn.execute("SELECT COUNT(*) FROM volumes").fetchone()[0]
            if vol_count == 0:
                for seed_file in sorted(SEEDS_DIR.glob("*.sql")):
                    conn.executescript(seed_file.read_text(encoding="utf-8"))
            conn.commit()
        finally:
            conn.close()

    def query_all(self, sql: str, params: Tuple[Any, ...] = ()) -> List[Dict[str, Any]]:
        conn = self.connect()
        try:
            rows = conn.execute(sql, params).fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    def query_one(self, sql: str, params: Tuple[Any, ...] = ()) -> Optional[Dict[str, Any]]:
        conn = self.connect()
        try:
            row = conn.execute(sql, params).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    def execute(self, sql: str, params: Tuple[Any, ...] = ()) -> None:
        conn = self.connect()
        try:
            conn.execute(sql, params)
            conn.commit()
        finally:
            conn.close()

    def log_audit(self, actor: Optional[Dict[str, Any]], action: str, entity_type: str, entity_id: str = "", details: Any = None) -> None:
        self.execute(
            "INSERT INTO audit_logs (id, actor_id, actor_role, action, entity_type, entity_id, details_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                f"aud-{uuid.uuid4().hex[:10]}",
                actor["id"] if actor else None,
                actor["role"] if actor else "guest",
                action,
                entity_type,
                entity_id,
                json.dumps(details or {}, ensure_ascii=False),
            ),
        )


def slugify(text: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in text)
    parts = [p for p in cleaned.split("-") if p]
    return "-".join(parts)[:60] or f"item-{uuid.uuid4().hex[:6]}"


class TFAMRequestHandler(BaseHTTPRequestHandler):
    db: Database  # injected on class

    def log_message(self, format: str, *args: Any) -> None:
        if os.environ.get("TFAM_QUIET") != "1":
            super().log_message(format, *args)

    def _send_json(self, data: Any, status: int = 200, extra_headers: Optional[Dict[str, str]] = None) -> None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> Dict[str, Any]:
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def _get_current_user(self) -> Optional[Dict[str, Any]]:
        token = None
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
        elif "Cookie" in self.headers:
            c = cookies.SimpleCookie()
            c.load(self.headers["Cookie"])
            if "tfam_session" in c:
                token = c["tfam_session"].value
        if not token:
            return None
        row = self.db.query_one(
            """
            SELECT u.id, u.email, u.display_name, u.role, s.expires_at
            FROM sessions s JOIN users u ON u.id = s.user_id
            WHERE s.token_hash = ? AND u.active = 1
            """,
            (hash_token(token),),
        )
        if not row:
            return None
        if row["expires_at"] < utc_now():
            self.db.execute("DELETE FROM sessions WHERE token_hash = ?", (hash_token(token),))
            return None
        return {
            "id": row["id"],
            "email": row["email"],
            "display_name": row["display_name"],
            "role": row["role"],
        }

    def _require_role(self, allowed: Tuple[str, ...]) -> Optional[Dict[str, Any]]:
        user = self._get_current_user()
        if not user:
            self._send_json({"error": "Authentication required", "code": "UNAUTHORIZED"}, 401)
            return None
        if user["role"] not in allowed:
            self._send_json({"error": f"Forbidden for role '{user['role']}'. Required: {list(allowed)}", "code": "FORBIDDEN"}, 403)
            return None
        return user

    def _serve_static(self, path: str) -> None:
        rel = path.lstrip("/") or "index.html"
        target = (STUDIO_DIR / rel).resolve()
        if not str(target).startswith(str(STUDIO_DIR.resolve())) or not target.is_file():
            target = STUDIO_DIR / "index.html"
        mime, _ = mimetypes.guess_type(str(target))
        content = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", f"{mime or 'application/octet-stream'}; charset=utf-8" if str(mime).startswith("text/") or mime in ("application/javascript", "application/json") else (mime or "application/octet-stream"))
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    # ---------------- HTTP METHODS ----------------
    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        qs = urllib.parse.parse_qs(parsed.query)
        try:
            if not path.startswith("/api/"):
                self._serve_static(path)
                return
            self._handle_get_api(path, qs)
        except Exception as exc:
            self._send_json({"error": str(exc), "code": "INTERNAL_ERROR"}, 500)

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        try:
            self._handle_post_api(parsed.path, self._read_json())
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON body", "code": "BAD_REQUEST"}, 400)
        except Exception as exc:
            self._send_json({"error": str(exc), "code": "INTERNAL_ERROR"}, 500)

    def do_PUT(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        try:
            self._handle_put_api(parsed.path, self._read_json())
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON body", "code": "BAD_REQUEST"}, 400)
        except Exception as exc:
            self._send_json({"error": str(exc), "code": "INTERNAL_ERROR"}, 500)

    def do_DELETE(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        try:
            self._handle_delete_api(parsed.path)
        except Exception as exc:
            self._send_json({"error": str(exc), "code": "INTERNAL_ERROR"}, 500)

    # ---------------- GET ROUTES ----------------
    def _handle_get_api(self, path: str, qs: Dict[str, List[str]]) -> None:
        # Health & Auth
        if path == "/api/health":
            self._send_json({"ok": True, "service": "tfam-studio-api", "time": utc_now()})
            return

        if path == "/api/auth/me":
            user = self._get_current_user()
            self._send_json({"authenticated": bool(user), "user": user})
            return

        # PUBLIC SITE READ-ONLY API (strictly published snapshots only; never leaks private/draft/what_if!)
        if path == "/api/public/catalog":
            max_ch = int(qs.get("unlocked_chapter", ["9999"])[0])
            snaps = self.db.query_all(
                "SELECT id, entity_type, entity_id, version_number, visibility, spoiler_gate_chapter, payload_json, release_notes, published_at FROM published_snapshots WHERE is_active = 1 ORDER BY published_at DESC"
            )
            visible = []
            for s in snaps:
                gate = s["spoiler_gate_chapter"]
                if gate is not None and int(gate) > max_ch:
                    continue
                payload = json.loads(s["payload_json"])
                # Strip any private fields defensively
                payload.pop("private_notes", None)
                payload.pop("author_notes", None)
                visible.append({
                    "snapshot_id": s["id"],
                    "entity_type": s["entity_type"],
                    "entity_id": s["entity_id"],
                    "version_number": s["version_number"],
                    "visibility": s["visibility"],
                    "published_at": s["published_at"],
                    "payload": payload,
                })
            self._send_json({"items": visible, "count": len(visible)})
            return

        if path.startswith("/api/public/chapters/"):
            ch_id = path.split("/")[-1]
            snap = self.db.query_one(
                "SELECT * FROM published_snapshots WHERE entity_type='chapter' AND entity_id=? AND is_active=1",
                (ch_id,),
            )
            if not snap:
                self._send_json({"error": "Published chapter not found", "code": "NOT_FOUND"}, 404)
                return
            user = self._get_current_user()
            if snap["visibility"] == "paid":
                if not user:
                    self._send_json({"error": "Paid chapter requires reader login & entitlement", "code": "PAYMENT_REQUIRED"}, 402)
                    return
                if user["role"] not in ("owner", "editor"):
                    ent = self.db.query_one(
                        "SELECT id FROM reader_entitlements WHERE user_id=? AND status='active'",
                        (user["id"],),
                    )
                    if not ent:
                        self._send_json({"error": "Reader entitlement required", "code": "PAYMENT_REQUIRED"}, 402)
                        return
            payload = json.loads(snap["payload_json"])
            payload.pop("author_notes", None)
            self._send_json({"snapshot_id": snap["id"], "version": snap["version_number"], "chapter": payload})
            return

        # All Studio endpoints below require Owner or Editor!
        user = self._require_role(("owner", "editor"))
        if not user:
            return

        # 01. Dashboard
        if path == "/api/dashboard":
            vols = self.db.query_all("SELECT * FROM volumes ORDER BY sort_order")
            ch_stats = self.db.query_one(
                """
                SELECT COUNT(*) as total,
                       SUM(word_count) as total_words,
                       SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published,
                       SUM(CASE WHEN status IN ('review','preview') THEN 1 ELSE 0 END) as awaiting_review,
                       SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as drafts
                FROM chapters
                """
            )
            canon_stats = self.db.query_one(
                """
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN data_state='canon' THEN 1 ELSE 0 END) as canon,
                       SUM(CASE WHEN data_state='draft' THEN 1 ELSE 0 END) as draft,
                       SUM(CASE WHEN data_state='what_if' THEN 1 ELSE 0 END) as what_if
                FROM canon_entries
                """
            )
            char_count = self.db.query_one("SELECT COUNT(*) as c FROM characters")["c"]
            asset_stats = self.db.query_one(
                "SELECT COUNT(*) as total, SUM(CASE WHEN usage_refs_json='[]' THEN 1 ELSE 0 END) as orphans FROM assets"
            )
            qa_open = self.db.query_one("SELECT COUNT(*) as c FROM qa_findings WHERE status='open'")["c"]
            staging_pending = self.db.query_one("SELECT COUNT(*) as c FROM import_staging WHERE status='pending_review'")["c"]
            revenue = self.db.query_one(
                "SELECT COALESCE(SUM(amount_cents),0) as total_cents, COUNT(*) as order_count FROM orders WHERE status IN ('sandbox_completed','paid')"
            )
            recent_audit = self.db.query_all("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10")
            self._send_json({
                "volumes": vols,
                "chapters": ch_stats,
                "canon": canon_stats,
                "characters_count": char_count,
                "assets": asset_stats,
                "qa_open_findings": qa_open,
                "import_pending": staging_pending,
                "commerce": revenue,
                "recent_activity": recent_audit,
            })
            return

        # Global Command-K Search
        if path == "/api/search":
            q = (qs.get("q", [""])[0]).strip()
            like = f"%{q}%"
            chapters = self.db.query_all("SELECT id, code, title, status, chapter_number FROM chapters WHERE title LIKE ? OR content LIKE ? LIMIT 8", (like, like))
            chars = self.db.query_all("SELECT id, name, epithet, faction, data_state FROM characters WHERE name LIKE ? OR biography LIKE ? OR abilities LIKE ? LIMIT 8", (like, like, like))
            canon = self.db.query_all("SELECT id, title, category, data_state FROM canon_entries WHERE title LIKE ? OR summary LIKE ? OR body LIKE ? LIMIT 8", (like, like, like))
            events = self.db.query_all("SELECT id, event_code, title, in_world_date, chapter_number FROM timeline_events WHERE title LIKE ? OR summary LIKE ? LIMIT 8", (like, like))
            self._send_json({"query": q, "chapters": chapters, "characters": chars, "canon": canon, "timeline": events})
            return

        # 02. Manuscript Management
        if path == "/api/volumes":
            vols = self.db.query_all("SELECT * FROM volumes ORDER BY sort_order")
            arcs = self.db.query_all("SELECT * FROM arcs ORDER BY sort_order")
            self._send_json({"volumes": vols, "arcs": arcs})
            return

        if path == "/api/chapters":
            vol_id = qs.get("volume_id", [None])[0]
            if vol_id:
                rows = self.db.query_all("SELECT * FROM chapters WHERE volume_id=? ORDER BY chapter_number, sort_order", (vol_id,))
            else:
                rows = self.db.query_all("SELECT * FROM chapters ORDER BY chapter_number, sort_order")
            self._send_json({"chapters": rows})
            return

        if path.startswith("/api/chapters/") and path.endswith("/revisions"):
            ch_id = path.split("/")[3]
            revs = self.db.query_all("SELECT * FROM chapter_revisions WHERE chapter_id=? ORDER BY version_number DESC", (ch_id,))
            self._send_json({"revisions": revs})
            return

        if path.startswith("/api/chapters/") and path.endswith("/context"):
            ch_id = path.split("/")[3]
            ch = self.db.query_one("SELECT * FROM chapters WHERE id=?", (ch_id,))
            if not ch:
                self._send_json({"error": "Chapter not found"}, 404)
                return
            links = self.db.query_all(
                "SELECT * FROM canon_links WHERE (source_type='chapter' AND source_id=?) OR (target_type='chapter' AND target_id=?)",
                (ch_id, ch_id),
            )
            linked_char_ids = set()
            for lk in links:
                if lk["source_type"] == "character":
                    linked_char_ids.add(lk["source_id"])
                if lk["target_type"] == "character":
                    linked_char_ids.add(lk["target_id"])
            # Also detect characters mentioned by name in chapter text
            all_chars = self.db.query_all("SELECT id, name, epithet, voice_profile, faction FROM characters")
            appearing = []
            content_lower = (ch["content"] or "").lower()
            for c in all_chars:
                first_word = c["name"].split()[0].lower()
                if c["id"] in linked_char_ids or first_word in content_lower:
                    appearing.append(c)
            qa_alerts = self.db.query_all(
                "SELECT * FROM qa_findings WHERE chapter_id=? AND status='open' ORDER BY CASE severity WHEN 'error' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END",
                (ch_id,),
            )
            events = self.db.query_all("SELECT * FROM timeline_events WHERE chapter_number=?", (ch["chapter_number"],))
            snapshots = self.db.query_all("SELECT id, version_number, visibility, published_at, is_active FROM published_snapshots WHERE entity_type='chapter' AND entity_id=? ORDER BY version_number DESC", (ch_id,))
            self._send_json({
                "chapter": ch,
                "appearing_characters": appearing,
                "linked_events": events,
                "qa_alerts": qa_alerts,
                "published_snapshots": snapshots,
            })
            return

        if path.startswith("/api/chapters/"):
            ch_id = path.split("/")[3]
            ch = self.db.query_one("SELECT * FROM chapters WHERE id=?", (ch_id,))
            if not ch:
                self._send_json({"error": "Chapter not found"}, 404)
                return
            self._send_json({"chapter": ch})
            return

        # 03. Character Studio
        if path == "/api/characters":
            chars = self.db.query_all("SELECT * FROM characters ORDER BY first_appearance_chapter, name")
            rels = self.db.query_all("SELECT * FROM character_relationships ORDER BY as_of_chapter")
            self._send_json({"characters": chars, "relationships": rels})
            return

        # 04. Canon Database & Canon Graph
        if path == "/api/canon":
            state = qs.get("data_state", [None])[0]
            if state:
                entries = self.db.query_all("SELECT * FROM canon_entries WHERE data_state=? ORDER BY updated_at DESC", (state,))
            else:
                entries = self.db.query_all("SELECT * FROM canon_entries ORDER BY updated_at DESC")
            self._send_json({"entries": entries})
            return

        if path == "/api/canon/graph":
            chars = self.db.query_all("SELECT id, name as label, 'character' as type, data_state FROM characters")
            canon = self.db.query_all("SELECT id, title as label, 'canon' as type, data_state FROM canon_entries")
            chaps = self.db.query_all("SELECT id, code || ' · ' || title as label, 'chapter' as type, data_state FROM chapters")
            events = self.db.query_all("SELECT id, event_code || ' · ' || title as label, 'timeline' as type, data_state FROM timeline_events")
            edges = self.db.query_all("SELECT * FROM canon_links")
            self._send_json({"nodes": chars + canon + chaps + events, "edges": edges})
            return

        # 05. Timeline & Character Knowledge State
        if path == "/api/timeline":
            events = self.db.query_all("SELECT * FROM timeline_events ORDER BY sort_year, chapter_number")
            self._send_json({"events": events})
            return

        if path == "/api/knowledge-state":
            char_id = qs.get("character_id", [None])[0]
            at_chapter = int(qs.get("chapter", ["218"])[0])
            if char_id:
                rows = self.db.query_all(
                    """
                    SELECT k.*, c.name as character_name, e.title as event_title, e.in_world_date
                    FROM character_knowledge_states k
                    JOIN characters c ON c.id = k.character_id
                    LEFT JOIN timeline_events e ON e.id = k.source_event_id
                    WHERE k.character_id = ?
                    ORDER BY COALESCE(k.learned_chapter, 9999)
                    """,
                    (char_id,),
                )
            else:
                rows = self.db.query_all(
                    """
                    SELECT k.*, c.name as character_name, e.title as event_title, e.in_world_date
                    FROM character_knowledge_states k
                    JOIN characters c ON c.id = k.character_id
                    LEFT JOIN timeline_events e ON e.id = k.source_event_id
                    ORDER BY c.name, COALESCE(k.learned_chapter, 9999)
                    """
                )
            known = []
            unknown = []
            for r in rows:
                lc = r["learned_chapter"]
                if lc is not None and int(lc) <= at_chapter:
                    r["status_at_chapter"] = "known"
                    known.append(r)
                else:
                    r["status_at_chapter"] = "cannot_know_yet"
                    unknown.append(r)
            self._send_json({
                "at_chapter": at_chapter,
                "character_id": char_id,
                "known": known,
                "cannot_know_yet": unknown,
            })
            return

        # 06. Worldbuilding & 07. War Room + What-if Sandbox
        if path == "/api/world":
            entities = self.db.query_all("SELECT * FROM world_entities ORDER BY entity_type, name")
            self._send_json({"entities": entities})
            return

        if path == "/api/war-room/campaigns":
            campaigns = self.db.query_all("SELECT * FROM war_campaigns ORDER BY data_state, created_at DESC")
            self._send_json({"campaigns": campaigns})
            return

        if path == "/api/what-if":
            scenarios = self.db.query_all("SELECT * FROM what_if_scenarios ORDER BY created_at DESC")
            self._send_json({"scenarios": scenarios})
            return

        # 08. Narrative QA Findings
        if path == "/api/qa/findings":
            ch_id = qs.get("chapter_id", [None])[0]
            if ch_id:
                rows = self.db.query_all("SELECT * FROM qa_findings WHERE chapter_id=? ORDER BY created_at DESC", (ch_id,))
            else:
                rows = self.db.query_all("SELECT * FROM qa_findings ORDER BY created_at DESC LIMIT 100")
            self._send_json({"findings": rows})
            return

        # 09. Asset Library
        if path == "/api/assets":
            assets = self.db.query_all("SELECT * FROM assets ORDER BY created_at DESC")
            orphans = [a for a in assets if (a["usage_refs_json"] or "[]").strip() in ("[]", "")]
            self._send_json({"assets": assets, "orphan_count": len(orphans)})
            return

        # 10. Publishing Center
        if path == "/api/publishing/queue":
            chapters = self.db.query_all("SELECT id, code, title, chapter_number, status, visibility, data_state, spoiler_gate_chapter, published_at, scheduled_publish_at FROM chapters ORDER BY chapter_number")
            characters = self.db.query_all("SELECT id, name, data_state, visibility, spoiler_gate_chapter FROM characters ORDER BY name")
            canon = self.db.query_all("SELECT id, title, category, data_state, visibility, spoiler_gate_chapter FROM canon_entries ORDER BY title")
            snapshots = self.db.query_all("SELECT * FROM published_snapshots ORDER BY published_at DESC LIMIT 50")
            self._send_json({"chapters": chapters, "characters": characters, "canon": canon, "snapshots": snapshots})
            return

        # 11. Commerce Manager
        if path == "/api/commerce/overview":
            products = self.db.query_all("SELECT * FROM products ORDER BY price_cents")
            orders = self.db.query_all(
                """
                SELECT o.*, p.title as product_title, u.email as user_email
                FROM orders o
                LEFT JOIN products p ON p.id = o.product_id
                LEFT JOIN users u ON u.id = o.user_id
                ORDER BY o.created_at DESC
                """
            )
            entitlements = self.db.query_all(
                """
                SELECT e.*, u.email as user_email, p.title as product_title
                FROM reader_entitlements e
                JOIN users u ON u.id = e.user_id
                LEFT JOIN products p ON p.id = e.product_id
                ORDER BY e.granted_at DESC
                """
            )
            self._send_json({
                "payment_provider": "sandbox",
                "production_blocker": "Chưa kết nối khóa Stripe/Payment Gateway thực. Mọi giao dịch hiện chạy ở chế độ Sandbox kiểm thử.",
                "products": products,
                "orders": orders,
                "entitlements": entitlements,
            })
            return

        # 12. Reader Analytics
        if path == "/api/analytics":
            by_chapter = self.db.query_all(
                """
                SELECT c.id, c.code, c.title,
                       COUNT(r.id) as reads,
                       ROUND(AVG(r.completion_pct), 1) as avg_completion_pct,
                       ROUND(AVG(r.duration_seconds), 0) as avg_duration_sec
                FROM chapters c
                LEFT JOIN reading_events r ON r.chapter_id = c.id
                GROUP BY c.id
                ORDER BY reads DESC, c.chapter_number
                """
            )
            by_lang = self.db.query_all("SELECT language, COUNT(*) as reads FROM reading_events GROUP BY language")
            rev = self.db.query_one("SELECT COALESCE(SUM(amount_cents),0) as sandbox_revenue_cents, COUNT(*) as sandbox_orders FROM orders WHERE status='sandbox_completed'")
            self._send_json({"chapters": by_chapter, "by_language": by_lang, "revenue": rev})
            return

        # 14. TFAM Data Importer
        if path == "/api/importer/staging":
            rows = self.db.query_all("SELECT * FROM import_staging ORDER BY created_at DESC")
            self._send_json({"staging": rows})
            return

        # 13. System & Administration (Owner only for sensitive admin ops)
        if path == "/api/admin/overview":
            if user["role"] != "owner":
                self._send_json({"error": "Owner role required for system administration"}, 403)
                return
            users = self.db.query_all("SELECT id, email, display_name, role, active, created_at FROM users ORDER BY created_at")
            audit = self.db.query_all("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 40")
            settings = self.db.query_all("SELECT * FROM system_settings")
            self._send_json({"users": users, "audit_logs": audit, "settings": settings})
            return

        if path == "/api/admin/backup":
            if user["role"] != "owner":
                self._send_json({"error": "Owner role required for backup export"}, 403)
                return
            tables = [
                "volumes", "arcs", "chapters", "chapter_revisions", "characters",
                "character_relationships", "canon_entries", "canon_links",
                "timeline_events", "character_knowledge_states", "world_entities",
                "war_campaigns", "what_if_scenarios", "assets", "published_snapshots",
                "products", "reader_entitlements", "orders", "import_staging",
            ]
            dump = {t: self.db.query_all(f"SELECT * FROM {t}") for t in tables}
            self.db.log_audit(user, "export_backup", "system", "full_db", {"tables": len(tables)})
            self._send_json({"exported_at": utc_now(), "schema_version": "0001_initial", "data": dump})
            return

        self._send_json({"error": f"Unknown GET endpoint: {path}", "code": "NOT_FOUND"}, 404)

    # ---------------- POST ROUTES ----------------
    def _handle_post_api(self, path: str, body: Dict[str, Any]) -> None:
        if path == "/api/auth/login":
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            row = self.db.query_one("SELECT * FROM users WHERE lower(email)=? AND active=1", (email,))
            if not row or not verify_password(password, row["password_hash"], row["password_salt"]):
                self._send_json({"error": "Invalid email or password", "code": "INVALID_CREDENTIALS"}, 401)
                return
            raw_token = secrets.token_urlsafe(32)
            expires = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
            self.db.execute(
                "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
                (hash_token(raw_token), row["id"], expires),
            )
            actor = {"id": row["id"], "email": row["email"], "display_name": row["display_name"], "role": row["role"]}
            self.db.log_audit(actor, "login", "auth", row["id"])
            cookie_val = f"tfam_session={raw_token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800"
            self._send_json({"authenticated": True, "token": raw_token, "user": actor}, 200, {"Set-Cookie": cookie_val})
            return

        if path == "/api/auth/logout":
            auth_header = self.headers.get("Authorization", "")
            token = auth_header[7:].strip() if auth_header.startswith("Bearer ") else None
            if not token and "Cookie" in self.headers:
                c = cookies.SimpleCookie()
                c.load(self.headers["Cookie"])
                if "tfam_session" in c:
                    token = c["tfam_session"].value
            if token:
                self.db.execute("DELETE FROM sessions WHERE token_hash=?", (hash_token(token),))
            self._send_json({"ok": True}, 200, {"Set-Cookie": "tfam_session=; HttpOnly; Path=/; Max-Age=0"})
            return

        # Studio mutations require Owner or Editor
        user = self._require_role(("owner", "editor"))
        if not user:
            return

        # Create Chapter
        if path == "/api/chapters":
            ch_id = f"ch-{uuid.uuid4().hex[:8]}"
            vol_id = body.get("volume_id") or "vol-6"
            arc_id = body.get("arc_id")
            ch_num = int(body.get("chapter_number") or 220)
            title = (body.get("title") or f"Chương {ch_num}: Bản Nháp Mới").strip()
            content = body.get("content") or ""
            wc = len(content.split())
            code = body.get("code") or f"CH-{ch_num:03d}-{uuid.uuid4().hex[:3].upper()}"
            self.db.execute(
                """
                INSERT INTO chapters (id, volume_id, arc_id, chapter_number, code, title, language, content, word_count, sort_order, status, visibility, data_state, author_notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'private', 'draft', ?)
                """,
                (ch_id, vol_id, arc_id, ch_num, code, title, body.get("language", "vi"), content, wc, ch_num, body.get("author_notes", "")),
            )
            self.db.execute(
                "INSERT INTO chapter_revisions (id, chapter_id, version_number, title, content, word_count, change_summary, created_by) VALUES (?, ?, 1, ?, ?, ?, 'Khởi tạo chương mới', ?)",
                (f"rev-{uuid.uuid4().hex[:8]}", ch_id, title, content, wc, user["id"]),
            )
            self.db.log_audit(user, "create_chapter", "chapter", ch_id, {"title": title})
            self._send_json({"chapter": self.db.query_one("SELECT * FROM chapters WHERE id=?", (ch_id,))}, 201)
            return

        # Restore Chapter Revision
        if path.startswith("/api/chapters/") and "/restore/" in path:
            parts = path.split("/")
            ch_id, rev_id = parts[3], parts[5]
            rev = self.db.query_one("SELECT * FROM chapter_revisions WHERE id=? AND chapter_id=?", (rev_id, ch_id))
            if not rev:
                self._send_json({"error": "Revision not found"}, 404)
                return
            self.db.execute(
                "UPDATE chapters SET title=?, content=?, word_count=?, updated_at=? WHERE id=?",
                (rev["title"], rev["content"], rev["word_count"], utc_now(), ch_id),
            )
            next_v = (self.db.query_one("SELECT COALESCE(MAX(version_number),0) as m FROM chapter_revisions WHERE chapter_id=?", (ch_id,))["m"]) + 1
            self.db.execute(
                "INSERT INTO chapter_revisions (id, chapter_id, version_number, title, content, word_count, change_summary, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (f"rev-{uuid.uuid4().hex[:8]}", ch_id, next_v, rev["title"], rev["content"], rev["word_count"], f"Phục hồi từ phiên bản v{rev['version_number']}", user["id"]),
            )
            self.db.log_audit(user, "restore_revision", "chapter", ch_id, {"restored_version": rev["version_number"]})
            self._send_json({"chapter": self.db.query_one("SELECT * FROM chapters WHERE id=?", (ch_id,))})
            return

        # Create Character
        if path == "/api/characters":
            cid = f"char-{uuid.uuid4().hex[:8]}"
            name = (body.get("name") or "").strip()
            if not name:
                self._send_json({"error": "Character name is required"}, 400)
                return
            slug = f"{slugify(name)}-{uuid.uuid4().hex[:4]}"
            self.db.execute(
                """
                INSERT INTO characters (id, slug, name, epithet, faction, affiliation, rank_title, age_display, appearance, biography, personality, voice_profile, speech_conventions, abilities, vestigium_signature, arc_progression, private_notes, public_summary, first_appearance_chapter, data_state, visibility)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    cid, slug, name, body.get("epithet", ""), body.get("faction", ""), body.get("affiliation", ""),
                    body.get("rank_title", ""), body.get("age_display", ""), body.get("appearance", ""),
                    body.get("biography", ""), body.get("personality", ""), body.get("voice_profile", ""),
                    body.get("speech_conventions", ""), body.get("abilities", ""), body.get("vestigium_signature", ""),
                    body.get("arc_progression", ""), body.get("private_notes", ""), body.get("public_summary", ""),
                    body.get("first_appearance_chapter"), body.get("data_state", "draft"), body.get("visibility", "private"),
                ),
            )
            self.db.log_audit(user, "create_character", "character", cid, {"name": name})
            self._send_json({"character": self.db.query_one("SELECT * FROM characters WHERE id=?", (cid,))}, 201)
            return

        # Create Canon Entry
        if path == "/api/canon":
            eid = f"canon-{uuid.uuid4().hex[:8]}"
            title = (body.get("title") or "").strip()
            if not title:
                self._send_json({"error": "Canon title is required"}, 400)
                return
            category = body.get("category", "fact")
            data_state = body.get("data_state", "draft")
            if data_state not in ("canon", "draft", "what_if"):
                self._send_json({"error": "Invalid data_state"}, 400)
                return
            slug = f"{slugify(title)}-{uuid.uuid4().hex[:4]}"
            self.db.execute(
                """
                INSERT INTO canon_entries (id, slug, title, category, summary, body, source_chapter, data_state, visibility, private_notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (eid, slug, title, category, body.get("summary", ""), body.get("body", ""), body.get("source_chapter"), data_state, body.get("visibility", "private"), body.get("private_notes", "")),
            )
            self.db.log_audit(user, "create_canon", "canon", eid, {"title": title, "data_state": data_state})
            self._send_json({"entry": self.db.query_one("SELECT * FROM canon_entries WHERE id=?", (eid,))}, 201)
            return

        # Create Canon Graph Link
        if path == "/api/canon/graph":
            lid = f"lnk-{uuid.uuid4().hex[:8]}"
            self.db.execute(
                "INSERT INTO canon_links (id, source_type, source_id, target_type, target_id, relation_label, notes, data_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (lid, body["source_type"], body["source_id"], body["target_type"], body["target_id"], body.get("relation_label", "references"), body.get("notes", ""), body.get("data_state", "canon")),
            )
            self.db.log_audit(user, "create_canon_link", "canon_link", lid, body)
            self._send_json({"link": self.db.query_one("SELECT * FROM canon_links WHERE id=?", (lid,))}, 201)
            return

        # Create Timeline Event
        if path == "/api/timeline":
            tid = f"ev-{uuid.uuid4().hex[:8]}"
            code = body.get("event_code") or f"EV-{uuid.uuid4().hex[:4].upper()}"
            self.db.execute(
                """
                INSERT INTO timeline_events (id, event_code, title, in_world_date, sort_year, era, location, chapter_number, summary, participants_json, data_state, visibility)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    tid, code, body["title"], body.get("in_world_date", "1717"), float(body.get("sort_year", 1717)),
                    body.get("era", ""), body.get("location", ""), body.get("chapter_number"),
                    body.get("summary", ""), json.dumps(body.get("participants", []), ensure_ascii=False),
                    body.get("data_state", "draft"), body.get("visibility", "private"),
                ),
            )
            self.db.log_audit(user, "create_timeline_event", "timeline", tid, {"title": body["title"]})
            self._send_json({"event": self.db.query_one("SELECT * FROM timeline_events WHERE id=?", (tid,))}, 201)
            return

        # Create Knowledge State Fact
        if path == "/api/knowledge-state":
            kid = f"kn-{uuid.uuid4().hex[:8]}"
            self.db.execute(
                """
                INSERT INTO character_knowledge_states (id, character_id, fact_key, fact_statement, keywords_json, learned_chapter, source_event_id, certainty, notes, data_state)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    kid, body["character_id"], body.get("fact_key") or slugify(body["fact_statement"]),
                    body["fact_statement"], json.dumps(body.get("keywords", []), ensure_ascii=False),
                    body.get("learned_chapter"), body.get("source_event_id"),
                    body.get("certainty", "known"), body.get("notes", ""), body.get("data_state", "canon"),
                ),
            )
            self.db.log_audit(user, "create_knowledge_state", "knowledge_state", kid, {"character_id": body["character_id"]})
            self._send_json({"knowledge": self.db.query_one("SELECT * FROM character_knowledge_states WHERE id=?", (kid,))}, 201)
            return

        # Worldbuilding & War Room & What-if Sandbox
        if path == "/api/world":
            wid = f"we-{uuid.uuid4().hex[:8]}"
            self.db.execute(
                "INSERT INTO world_entities (id, entity_type, name, region, description, attributes_json, data_state, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (wid, body.get("entity_type", "faction"), body["name"], body.get("region", ""), body.get("description", ""), json.dumps(body.get("attributes", {}), ensure_ascii=False), body.get("data_state", "draft"), body.get("visibility", "private")),
            )
            self.db.log_audit(user, "create_world_entity", "world", wid, {"name": body["name"]})
            self._send_json({"entity": self.db.query_one("SELECT * FROM world_entities WHERE id=?", (wid,))}, 201)
            return

        if path == "/api/war-room/campaigns":
            cid = f"camp-{uuid.uuid4().hex[:8]}"
            self.db.execute(
                """
                INSERT INTO war_campaigns (id, name, theater, period, status, commanders_json, forces_json, frontlines_json, objectives, logistics_notes, data_state)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    cid, body["name"], body.get("theater", ""), body.get("period", "1717"), body.get("status", "planned"),
                    json.dumps(body.get("commanders", []), ensure_ascii=False),
                    json.dumps(body.get("forces", []), ensure_ascii=False),
                    json.dumps(body.get("frontlines", []), ensure_ascii=False),
                    body.get("objectives", ""), body.get("logistics_notes", ""), body.get("data_state", "draft"),
                ),
            )
            self.db.log_audit(user, "create_campaign", "campaign", cid, {"name": body["name"]})
            self._send_json({"campaign": self.db.query_one("SELECT * FROM war_campaigns WHERE id=?", (cid,))}, 201)
            return

        if path == "/api/what-if":
            sid = f"wi-{uuid.uuid4().hex[:8]}"
            div_ch = int(body.get("divergence_chapter") or 218)
            # Compute potentially affected canon timeline events at/after divergence chapter (read-only analysis; never alters canon!)
            downstream = self.db.query_all("SELECT id, event_code, title, chapter_number FROM timeline_events WHERE chapter_number >= ? AND data_state='canon'", (div_ch,))
            impacted_ids = [d["id"] for d in downstream]
            self.db.execute(
                "INSERT INTO what_if_scenarios (id, title, divergence_chapter, base_event_id, premise, changes_json, impacted_entities_json, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (sid, body["title"], div_ch, body.get("base_event_id"), body["premise"], json.dumps(body.get("changes", []), ensure_ascii=False), json.dumps(impacted_ids), body.get("notes", "")),
            )
            self.db.log_audit(user, "create_what_if", "what_if", sid, {"title": body["title"], "canon_untouched": True})
            self._send_json({"scenario": self.db.query_one("SELECT * FROM what_if_scenarios WHERE id=?", (sid,)), "downstream_canon_events": downstream}, 201)
            return

        # 08. Narrative QA Run
        if path.startswith("/api/qa/run/"):
            ch_id = path.split("/")[-1]
            ch = self.db.query_one("SELECT * FROM chapters WHERE id=?", (ch_id,))
            if not ch:
                self._send_json({"error": "Chapter not found"}, 404)
                return
            knowledge_rows = self.db.query_all("SELECT * FROM character_knowledge_states WHERE data_state='canon'")
            chars = {c["id"]: c for c in self.db.query_all("SELECT id, name FROM characters")}
            result = run_deterministic_qa(ch, knowledge_rows, chars)
            # Replace open deterministic findings for this chapter
            self.db.execute("DELETE FROM qa_findings WHERE chapter_id=? AND source_engine='deterministic' AND status='open'", (ch_id,))
            for f in result["deterministic_findings"]:
                self.db.execute(
                    """
                    INSERT INTO qa_findings (id, chapter_id, category, severity, source_engine, excerpt, explanation, suggested_revision, evidence_ref, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
                    """,
                    (f["id"], f["chapter_id"], f["category"], f["severity"], f["source_engine"], f["excerpt"], f["explanation"], f["suggested_revision"], f["evidence_ref"]),
                )
            self.db.log_audit(user, "run_narrative_qa", "chapter", ch_id, {"findings": len(result["deterministic_findings"])})
            self._send_json(result)
            return

        if path.startswith("/api/qa/findings/") and path.endswith("/status"):
            fid = path.split("/")[4]
            new_status = body.get("status", "dismissed")
            if new_status not in ("open", "accepted", "dismissed"):
                self._send_json({"error": "Invalid QA finding status"}, 400)
                return
            self.db.execute("UPDATE qa_findings SET status=? WHERE id=?", (new_status, fid))
            self._send_json({"ok": True, "id": fid, "status": new_status})
            return

        # 09. Asset Library (R2 metadata only; never deletes R2 objects automatically)
        if path == "/api/assets":
            aid = f"ast-{uuid.uuid4().hex[:8]}"
            r2_key = (body.get("r2_key") or f"tfam/uploads/{slugify(body.get('title','asset'))}.webp").strip()
            public_url = body.get("public_url") or f"https://r2.tfam.example/{r2_key}"
            self.db.execute(
                """
                INSERT INTO assets (id, r2_key, public_url, title, category, mime_type, size_bytes, tags_json, usage_refs_json, visibility, publish_permission)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    aid, r2_key, public_url, body["title"], body.get("category", "misc"),
                    body.get("mime_type", "image/webp"), int(body.get("size_bytes", 0)),
                    json.dumps(body.get("tags", []), ensure_ascii=False),
                    json.dumps(body.get("usage_refs", []), ensure_ascii=False),
                    body.get("visibility", "private"), body.get("publish_permission", "restricted"),
                ),
            )
            self.db.log_audit(user, "register_asset", "asset", aid, {"r2_key": r2_key})
            self._send_json({"asset": self.db.query_one("SELECT * FROM assets WHERE id=?", (aid,))}, 201)
            return

        # 10. Publishing Center (Draft -> Review -> Preview -> Approved -> Published)
        if path == "/api/publishing/transition":
            ch_id = body["chapter_id"]
            next_status = body["status"]
            if next_status not in ("draft", "review", "preview", "approved"):
                self._send_json({"error": "Use /api/publishing/approve to publish a chapter"}, 400)
                return
            self.db.execute("UPDATE chapters SET status=?, updated_at=? WHERE id=?", (next_status, utc_now(), ch_id))
            self.db.log_audit(user, "transition_chapter_status", "chapter", ch_id, {"status": next_status})
            self._send_json({"chapter": self.db.query_one("SELECT * FROM chapters WHERE id=?", (ch_id,))})
            return

        if path == "/api/publishing/approve":
            if user["role"] != "owner":
                self._send_json({"error": "Only Owner can approve and publish to Public Site"}, 403)
                return
            entity_type = body.get("entity_type", "chapter")
            entity_id = body["entity_id"]
            visibility = body.get("visibility", "public")
            if visibility not in ("public", "paid"):
                self._send_json({"error": "Published snapshot visibility must be 'public' or 'paid'"}, 400)
                return
            release_notes = body.get("release_notes", "")

            if entity_type == "chapter":
                rec = self.db.query_one("SELECT * FROM chapters WHERE id=?", (entity_id,))
                if not rec:
                    self._send_json({"error": "Chapter not found"}, 404)
                    return
                if rec["data_state"] == "what_if":
                    self._send_json({"error": "Cannot publish What-if experimental content directly to Public Site"}, 400)
                    return
                payload = {
                    "id": rec["id"], "code": rec["code"], "title": rec["title"],
                    "chapter_number": rec["chapter_number"], "language": rec["language"],
                    "content": rec["content"], "word_count": rec["word_count"],
                    "visibility": visibility, "price_cents": rec["price_cents"],
                }
                gate = rec["spoiler_gate_chapter"]
                self.db.execute(
                    "UPDATE chapters SET status='published', visibility=?, data_state='canon', published_at=?, updated_at=? WHERE id=?",
                    (visibility, utc_now(), utc_now(), entity_id),
                )
            elif entity_type == "character":
                rec = self.db.query_one("SELECT * FROM characters WHERE id=?", (entity_id,))
                if not rec or rec["data_state"] == "what_if":
                    self._send_json({"error": "Valid canonical/draft character not found"}, 404)
                    return
                payload = {
                    "id": rec["id"], "slug": rec["slug"], "name": rec["name"], "epithet": rec["epithet"],
                    "faction": rec["faction"], "rank_title": rec["rank_title"], "public_summary": rec["public_summary"],
                    "abilities": rec["abilities"], "vestigium_signature": rec["vestigium_signature"],
                }
                gate = rec["spoiler_gate_chapter"]
                self.db.execute("UPDATE characters SET visibility=?, data_state='canon', updated_at=? WHERE id=?", (visibility, utc_now(), entity_id))
            else:
                rec = self.db.query_one("SELECT * FROM canon_entries WHERE id=?", (entity_id,))
                if not rec or rec["data_state"] == "what_if":
                    self._send_json({"error": "Valid canon entry not found"}, 404)
                    return
                payload = {
                    "id": rec["id"], "slug": rec["slug"], "title": rec["title"],
                    "category": rec["category"], "summary": rec["summary"], "body": rec["body"],
                }
                gate = rec["spoiler_gate_chapter"]
                self.db.execute("UPDATE canon_entries SET visibility=?, data_state='canon', updated_at=? WHERE id=?", (visibility, utc_now(), entity_id))

            next_ver = (self.db.query_one("SELECT COALESCE(MAX(version_number),0) as m FROM published_snapshots WHERE entity_type=? AND entity_id=?", (entity_type, entity_id))["m"]) + 1
            self.db.execute("UPDATE published_snapshots SET is_active=0 WHERE entity_type=? AND entity_id=?", (entity_type, entity_id))
            snap_id = f"snap-{uuid.uuid4().hex[:8]}"
            self.db.execute(
                """
                INSERT INTO published_snapshots (id, entity_type, entity_id, version_number, visibility, spoiler_gate_chapter, payload_json, approved_by, is_active, release_notes, published_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
                """,
                (snap_id, entity_type, entity_id, next_ver, visibility, gate, json.dumps(payload, ensure_ascii=False), user["id"], release_notes, utc_now()),
            )
            self.db.log_audit(user, "publish_approved", entity_type, entity_id, {"snapshot_id": snap_id, "version": next_ver, "visibility": visibility})
            self._send_json({"snapshot": self.db.query_one("SELECT * FROM published_snapshots WHERE id=?", (snap_id,))}, 201)
            return

        if path.startswith("/api/publishing/rollback/"):
            if user["role"] != "owner":
                self._send_json({"error": "Only Owner can rollback published snapshots"}, 403)
                return
            snap_id = path.split("/")[-1]
            snap = self.db.query_one("SELECT * FROM published_snapshots WHERE id=?", (snap_id,))
            if not snap:
                self._send_json({"error": "Snapshot not found"}, 404)
                return
            self.db.execute("UPDATE published_snapshots SET is_active=0 WHERE entity_type=? AND entity_id=?", (snap["entity_type"], snap["entity_id"]))
            self.db.execute("UPDATE published_snapshots SET is_active=1 WHERE id=?", (snap_id,))
            self.db.log_audit(user, "rollback_snapshot", snap["entity_type"], snap["entity_id"], {"snapshot_id": snap_id})
            self._send_json({"ok": True, "active_snapshot_id": snap_id})
            return

        # 11. Commerce Manager (Sandbox Checkout — never simulates live production payment)
        if path == "/api/commerce/products":
            pid = f"prod-{uuid.uuid4().hex[:8]}"
            self.db.execute(
                "INSERT INTO products (id, sku, title, product_type, price_cents, currency, active, entitlement_scope_json) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
                (pid, body["sku"], body["title"], body.get("product_type", "volume"), int(body.get("price_cents", 499)), body.get("currency", "USD"), json.dumps(body.get("entitlement_scope", {}))),
            )
            self.db.log_audit(user, "create_product", "product", pid, {"sku": body["sku"]})
            self._send_json({"product": self.db.query_one("SELECT * FROM products WHERE id=?", (pid,))}, 201)
            return

        if path == "/api/commerce/sandbox-checkout":
            prod = self.db.query_one("SELECT * FROM products WHERE id=?", (body["product_id"],))
            if not prod:
                self._send_json({"error": "Product not found"}, 404)
                return
            target_user_id = body.get("user_id") or "usr-reader"
            oid = f"ord-{uuid.uuid4().hex[:8]}"
            self.db.execute(
                "INSERT INTO orders (id, user_id, product_id, amount_cents, currency, provider, status) VALUES (?, ?, ?, ?, ?, 'sandbox', 'sandbox_completed')",
                (oid, target_user_id, prod["id"], prod["price_cents"], prod["currency"]),
            )
            eid = f"ent-{uuid.uuid4().hex[:8]}"
            self.db.execute(
                "INSERT INTO reader_entitlements (id, user_id, product_id, scope_key, status) VALUES (?, ?, ?, ?, 'active')",
                (eid, target_user_id, prod["id"], prod["sku"]),
            )
            self.db.log_audit(user, "sandbox_checkout", "order", oid, {"product": prod["sku"], "note": "SANDBOX ONLY"})
            self._send_json({"order_id": oid, "entitlement_id": eid, "provider": "sandbox", "status": "sandbox_completed"}, 201)
            return

        # 14. TFAM Data Importer (Upload -> Staging Queue -> Explicit Approval)
        if path == "/api/importer/upload":
            filename = body.get("filename") or "import.md"
            fmt = body.get("format") or ("docx" if filename.lower().endswith(".docx") else "json" if filename.lower().endswith(".json") else "markdown")
            staged_items = parse_import_payload(filename, fmt, body.get("text_content", ""), body.get("base64_content", ""))
            created = []
            for item in staged_items:
                sid = f"stg-{uuid.uuid4().hex[:8]}"
                self.db.execute(
                    "INSERT INTO import_staging (id, source_filename, source_format, target_type, extracted_title, extracted_payload_json, status) VALUES (?, ?, ?, ?, ?, ?, 'pending_review')",
                    (sid, item["source_filename"], item["source_format"], item["target_type"], item["extracted_title"], json.dumps(item["extracted_payload"], ensure_ascii=False)),
                )
                created.append(self.db.query_one("SELECT * FROM import_staging WHERE id=?", (sid,)))
            self.db.log_audit(user, "import_to_staging", "importer", filename, {"staged_count": len(created)})
            self._send_json({"staged_count": len(created), "items": created}, 201)
            return

        if path.startswith("/api/importer/staging/") and path.endswith("/decide"):
            sid = path.split("/")[4]
            decision = body.get("decision")  # approved_draft | approved_canon | rejected
            if decision not in ("approved_draft", "approved_canon", "rejected"):
                self._send_json({"error": "Invalid decision"}, 400)
                return
            row = self.db.query_one("SELECT * FROM import_staging WHERE id=?", (sid,))
            if not row:
                self._send_json({"error": "Staging item not found"}, 404)
                return
            created_entity_id = None
            if decision in ("approved_draft", "approved_canon"):
                data_state = "canon" if decision == "approved_canon" else "draft"
                payload = json.loads(row["extracted_payload_json"])
                if row["target_type"] == "chapter":
                    created_entity_id = f"ch-{uuid.uuid4().hex[:8]}"
                    ch_num = int(payload.get("chapter_number") or 230)
                    content = payload.get("content", "")
                    self.db.execute(
                        "INSERT INTO chapters (id, volume_id, chapter_number, code, title, language, content, word_count, sort_order, status, visibility, data_state) VALUES (?, 'vol-6', ?, ?, ?, ?, ?, ?, ?, 'draft', 'private', ?)",
                        (created_entity_id, ch_num, f"IMP-{ch_num}-{uuid.uuid4().hex[:3].upper()}", payload.get("title", row["extracted_title"]), payload.get("language", "vi"), content, len(content.split()), ch_num, data_state),
                    )
                elif row["target_type"] == "character":
                    created_entity_id = f"char-{uuid.uuid4().hex[:8]}"
                    name = payload.get("name", row["extracted_title"])
                    self.db.execute(
                        "INSERT INTO characters (id, slug, name, biography, data_state, visibility) VALUES (?, ?, ?, ?, ?, 'private')",
                        (created_entity_id, f"{slugify(name)}-{uuid.uuid4().hex[:4]}", name, payload.get("biography", ""), data_state),
                    )
                else:
                    created_entity_id = f"canon-{uuid.uuid4().hex[:8]}"
                    title = payload.get("title", row["extracted_title"])
                    self.db.execute(
                        "INSERT INTO canon_entries (id, slug, title, category, summary, body, data_state, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, 'private')",
                        (created_entity_id, f"{slugify(title)}-{uuid.uuid4().hex[:4]}", title, payload.get("category", "fact"), payload.get("summary", ""), payload.get("body", ""), data_state),
                    )
            self.db.execute("UPDATE import_staging SET status=?, reviewed_by=?, reviewed_at=? WHERE id=?", (decision, user["id"], utc_now(), sid))
            self.db.log_audit(user, f"importer_{decision}", row["target_type"], created_entity_id or sid)
            self._send_json({"ok": True, "staging_id": sid, "decision": decision, "created_entity_id": created_entity_id})
            return

        # 13. Admin: Create User
        if path == "/api/admin/users":
            if user["role"] != "owner":
                self._send_json({"error": "Owner role required"}, 403)
                return
            uid = f"usr-{uuid.uuid4().hex[:8]}"
            pw_hash, pw_salt = hash_password(body.get("password", "temp-pass-123"))
            self.db.execute(
                "INSERT INTO users (id, email, display_name, role, password_hash, password_salt) VALUES (?, ?, ?, ?, ?, ?)",
                (uid, body["email"].strip().lower(), body["display_name"], body["role"], pw_hash, pw_salt),
            )
            self.db.log_audit(user, "create_user", "user", uid, {"role": body["role"]})
            self._send_json({"id": uid, "email": body["email"], "role": body["role"]}, 201)
            return

        self._send_json({"error": f"Unknown POST endpoint: {path}", "code": "NOT_FOUND"}, 404)

    # ---------------- PUT ROUTES ----------------
    def _handle_put_api(self, path: str, body: Dict[str, Any]) -> None:
        user = self._require_role(("owner", "editor"))
        if not user:
            return

        # Update Chapter (Autosave + Version History)
        if path.startswith("/api/chapters/"):
            ch_id = path.split("/")[3]
            existing = self.db.query_one("SELECT * FROM chapters WHERE id=?", (ch_id,))
            if not existing:
                self._send_json({"error": "Chapter not found"}, 404)
                return
            title = body.get("title", existing["title"])
            content = body.get("content", existing["content"])
            wc = len(content.split())
            author_notes = body.get("author_notes", existing["author_notes"])
            visibility = body.get("visibility", existing["visibility"])
            spoiler_gate = body.get("spoiler_gate_chapter", existing["spoiler_gate_chapter"])
            self.db.execute(
                "UPDATE chapters SET title=?, content=?, word_count=?, author_notes=?, visibility=?, spoiler_gate_chapter=?, updated_at=? WHERE id=?",
                (title, content, wc, author_notes, visibility, spoiler_gate, utc_now(), ch_id),
            )
            if body.get("create_revision", True):
                next_v = (self.db.query_one("SELECT COALESCE(MAX(version_number),0) as m FROM chapter_revisions WHERE chapter_id=?", (ch_id,))["m"]) + 1
                self.db.execute(
                    "INSERT INTO chapter_revisions (id, chapter_id, version_number, title, content, word_count, change_summary, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (f"rev-{uuid.uuid4().hex[:8]}", ch_id, next_v, title, content, wc, body.get("change_summary", "Autosave"), user["id"]),
                )
            self.db.log_audit(user, "update_chapter", "chapter", ch_id, {"word_count": wc})
            self._send_json({"chapter": self.db.query_one("SELECT * FROM chapters WHERE id=?", (ch_id,))})
            return

        # Update Character
        if path.startswith("/api/characters/"):
            cid = path.split("/")[3]
            existing = self.db.query_one("SELECT * FROM characters WHERE id=?", (cid,))
            if not existing:
                self._send_json({"error": "Character not found"}, 404)
                return
            fields = [
                "name", "epithet", "faction", "affiliation", "rank_title", "age_display",
                "appearance", "biography", "personality", "voice_profile", "speech_conventions",
                "abilities", "vestigium_signature", "arc_progression", "private_notes",
                "public_summary", "data_state", "visibility",
            ]
            vals = [body.get(f, existing[f]) for f in fields] + [utc_now(), cid]
            set_clause = ", ".join(f"{f}=?" for f in fields) + ", updated_at=?"
            self.db.execute(f"UPDATE characters SET {set_clause} WHERE id=?", tuple(vals))
            self.db.log_audit(user, "update_character", "character", cid)
            self._send_json({"character": self.db.query_one("SELECT * FROM characters WHERE id=?", (cid,))})
            return

        # Update Canon Entry (protects Canon from silent What-if overwrite)
        if path.startswith("/api/canon/"):
            eid = path.split("/")[3]
            existing = self.db.query_one("SELECT * FROM canon_entries WHERE id=?", (eid,))
            if not existing:
                self._send_json({"error": "Canon entry not found"}, 404)
                return
            new_state = body.get("data_state", existing["data_state"])
            if existing["data_state"] == "canon" and new_state == "what_if":
                self._send_json({"error": "Cannot silently overwrite a Canon record with What-if state. Create a separate What-if branch instead."}, 409)
                return
            self.db.execute(
                "UPDATE canon_entries SET title=?, category=?, summary=?, body=?, source_chapter=?, data_state=?, visibility=?, private_notes=?, updated_at=? WHERE id=?",
                (
                    body.get("title", existing["title"]), body.get("category", existing["category"]),
                    body.get("summary", existing["summary"]), body.get("body", existing["body"]),
                    body.get("source_chapter", existing["source_chapter"]), new_state,
                    body.get("visibility", existing["visibility"]), body.get("private_notes", existing["private_notes"]),
                    utc_now(), eid,
                ),
            )
            self.db.log_audit(user, "update_canon", "canon", eid, {"data_state": new_state})
            self._send_json({"entry": self.db.query_one("SELECT * FROM canon_entries WHERE id=?", (eid,))})
            return

        # Update Timeline Event + Canon Graph Impact Suggestion
        if path.startswith("/api/timeline/"):
            tid = path.split("/")[3]
            existing = self.db.query_one("SELECT * FROM timeline_events WHERE id=?", (tid,))
            if not existing:
                self._send_json({"error": "Timeline event not found"}, 404)
                return
            self.db.execute(
                "UPDATE timeline_events SET title=?, in_world_date=?, sort_year=?, location=?, chapter_number=?, summary=?, updated_at=? WHERE id=?",
                (
                    body.get("title", existing["title"]), body.get("in_world_date", existing["in_world_date"]),
                    float(body.get("sort_year", existing["sort_year"])), body.get("location", existing["location"]),
                    body.get("chapter_number", existing["chapter_number"]), body.get("summary", existing["summary"]),
                    utc_now(), tid,
                ),
            )
            # Find linked knowledge states & chapters that should be re-checked
            affected_kn = self.db.query_all("SELECT id, character_id, fact_statement FROM character_knowledge_states WHERE source_event_id=?", (tid,))
            self.db.log_audit(user, "update_timeline_event", "timeline", tid, {"affected_knowledge_count": len(affected_kn)})
            self._send_json({
                "event": self.db.query_one("SELECT * FROM timeline_events WHERE id=?", (tid,)),
                "impact_review_suggestions": affected_kn,
            })
            return

        self._send_json({"error": f"Unknown PUT endpoint: {path}", "code": "NOT_FOUND"}, 404)

    def _handle_delete_api(self, path: str) -> None:
        user = self._require_role(("owner",))
        if not user:
            return
        if path.startswith("/api/chapters/"):
            ch_id = path.split("/")[3]
            self.db.execute("DELETE FROM chapters WHERE id=?", (ch_id,))
            self.db.log_audit(user, "delete_chapter", "chapter", ch_id)
            self._send_json({"ok": True, "deleted": ch_id})
            return
        self._send_json({"error": f"Unknown DELETE endpoint: {path}", "code": "NOT_FOUND"}, 404)


def run_server(host: str, port: int, db_path: Path) -> None:
    db = Database(db_path)

    class BoundHandler(TFAMRequestHandler):
        pass

    BoundHandler.db = db
    server = ThreadingHTTPServer((host, port), BoundHandler)
    print(f"TFAM Studio running at http://{host}:{port}")
    print(f"Database: {db_path}")
    print("Default Owner Login: author@tfam.studio / tfam-studio-dev-pass")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down TFAM Studio server...")
        server.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TFAM Studio Local Full-Stack Server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8787")))
    parser.add_argument("--db", default=str(DEFAULT_DB_PATH))
    parser.add_argument("--migrate-only", action="store_true")
    args = parser.parse_args()

    if args.migrate_only:
        Database(Path(args.db))
        print(f"Migrations & seed verified at {args.db}")
    else:
        run_server(args.host, args.port, Path(args.db))
