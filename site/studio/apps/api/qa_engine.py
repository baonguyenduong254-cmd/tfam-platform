"""
TFAM Narrative QA Engine (Deterministic Checks + Before/After Revision Preview)
Tailored specifically to Through Frost and Myth prose standards:
- Banned weak fillers & modern scientific/medical vocabulary
- Unnecessary negative-to-positive constructions
- Repeated bureaucratic/dossier motifs (hồ sơ, ghi chép, báo cáo...)
- Ping-pong dialogue (3+ consecutive short dialogue lines without action beats)
- Narrator over-explanation / dense walls of text
- Character Knowledge State & Timeline continuity violations with source chapter evidence
"""

from __future__ import annotations
import json
import re
import uuid
from typing import Any, Dict, List


BANNED_VOCAB = [
    ("đặc quánh", "Từ đệm yếu bị cấm trong phong cách TFAM", "nặng mùi / dày đặc / đặc sệt"),
    ("khẽ", "Từ đệm yếu lặp nhiều — nên thay bằng động tác cụ thể", "(bỏ từ 'khẽ' và tả trực tiếp cử chỉ)"),
    ("run rẩy", "Sáo ngữ cảm xúc — hãy 'Show, don't tell' qua phản xạ vật lý", "các đốt ngón tay siết chặt / hơi thở ngắt quãng"),
    ("milimet", "Thuật ngữ đo lường hiện đại lệch bối cảnh 1715–1718", "một lằn móng tay / vài phân"),
    ("chân không", "Thuật ngữ vật lý hiện đại lệch bối cảnh Vestigium", "khoảng trống lạnh / vùng tắt khí"),
    ("nơ-ron", "Thuật ngữ y học hiện đại lệch bối cảnh", "dây thần kinh / mạch cảm giác"),
    ("oxy", "Thuật ngữ hóa học hiện đại lệch bối cảnh", "không khí / hơi thở"),
    ("adrenaline", "Thuật ngữ sinh học hiện đại lệch bối cảnh", "máu dồn lên thái dương / nhịp tim dồn dập"),
]

NEG_TO_POS_PATTERNS = [
    re.compile(r"(không phải[^.\n]{2,60}?mà là[^.\n]{2,80})", re.IGNORECASE),
    re.compile(r"(chẳng phải[^.\n]{2,60}?mà là[^.\n]{2,80})", re.IGNORECASE),
    re.compile(r"(không chỉ[^.\n]{2,60}?mà còn[^.\n]{2,80})", re.IGNORECASE),
]

MOTIF_WORDS = ["hồ sơ", "ghi chép", "báo cáo", "tài liệu", "biên bản"]

TELL_EXPOSITION_MARKERS = [
    "có nghĩa là",
    "thực chất là",
    "điều này chứng tỏ",
    "như đã biết trước đó",
]


def _make_finding(
    chapter_id: str,
    category: str,
    severity: str,
    excerpt: str,
    explanation: str,
    suggested_revision: str,
    evidence_ref: str = "",
) -> Dict[str, Any]:
    return {
        "id": f"qa-{uuid.uuid4().hex[:10]}",
        "chapter_id": chapter_id,
        "category": category,
        "severity": severity,
        "source_engine": "deterministic",
        "excerpt": excerpt.strip()[:280],
        "explanation": explanation,
        "suggested_revision": suggested_revision,
        "evidence_ref": evidence_ref,
        "status": "open",
    }


def run_deterministic_qa(
    chapter: Dict[str, Any],
    knowledge_rows: List[Dict[str, Any]],
    characters_by_id: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    chapter_id = chapter["id"]
    chapter_num = int(chapter.get("chapter_number") or 0)
    content = chapter.get("content") or ""
    findings: List[Dict[str, Any]] = []
    suggested_text = content

    # 1. Banned vocabulary & anachronistic scientific terms
    lower_content = content.lower()
    for term, reason, replacement in BANNED_VOCAB:
        matches = list(re.finditer(re.escape(term), content, re.IGNORECASE))
        for m in matches:
            start = max(0, m.start() - 45)
            end = min(len(content), m.end() + 55)
            excerpt = content[start:end]
            findings.append(
                _make_finding(
                    chapter_id,
                    "banned_vocabulary",
                    "error" if term in ("milimet", "chân không", "nơ-ron", "oxy", "adrenaline") else "warning",
                    excerpt,
                    f"Phát hiện từ khóa '{m.group(0)}': {reason}.",
                    f"Cân nhắc thay '{m.group(0)}' bằng: {replacement}",
                    "TFAM Style Guide (Vocabulary Blacklist)",
                )
            )
            if not replacement.startswith("("):
                first_alt = replacement.split("/")[0].strip()
                suggested_text = re.sub(re.escape(term), first_alt, suggested_text, count=1, flags=re.IGNORECASE)

    # 2. Unnecessary negative-to-positive constructions
    for pat in NEG_TO_POS_PATTERNS:
        for m in pat.finditer(content):
            findings.append(
                _make_finding(
                    chapter_id,
                    "negative_to_positive",
                    "warning",
                    m.group(1),
                    "Cấu trúc phủ định để khẳng định ('không phải... mà là...') dễ làm giọng văn bị giải thích hóa.",
                    "Chuyển sang khẳng định trực diện bằng hình ảnh/hành động cụ thể.",
                    "TFAM Narrative QA Rule: Direct Assertion",
                )
            )

    # 3. Repeated bureaucratic / dossier motifs
    motif_hits = {}
    for mw in MOTIF_WORDS:
        cnt = len(re.findall(re.escape(mw), lower_content))
        if cnt > 0:
            motif_hits[mw] = cnt
    total_motif = sum(motif_hits.values())
    if total_motif >= 2:
        breakdown = ", ".join(f"{k} ({v})" for k, v in motif_hits.items())
        findings.append(
            _make_finding(
                chapter_id,
                "repeated_motif",
                "warning",
                f"Các từ motif lặp trong chương: {breakdown}",
                "Lặp motif giấy tờ/công vụ (hồ sơ, ghi chép, báo cáo) dễ khiến nhịp truyện khô khan kiểu báo cáo hành chính.",
                "Giảm bớt tham chiếu giấy tờ, thay bằng quan sát trực tiếp tại hiện trường hoặc đối thoại có ẩn ý.",
                f"Tổng số lần xuất hiện: {total_motif}",
            )
        )

    # 4. Ping-pong dialogue check (3+ consecutive short dialogue lines without action beats)
    lines = [ln.strip() for ln in content.splitlines() if ln.strip()]
    consec_dialogue: List[str] = []
    for ln in lines:
        is_short_quote = (
            (ln.startswith('"') or ln.startswith("“") or ln.startswith("-"))
            and len(ln.split()) <= 12
        )
        if is_short_quote:
            consec_dialogue.append(ln)
        else:
            if len(consec_dialogue) >= 3:
                findings.append(
                    _make_finding(
                        chapter_id,
                        "dialogue_pacing",
                        "warning",
                        " / ".join(consec_dialogue[:4]),
                        f"Phát hiện {len(consec_dialogue)} dòng thoại ngắn liên tiếp (ping-pong dialogue) thiếu nhịp hành động hoặc ngôn ngữ cơ thể.",
                        "Chèn thêm cử chỉ vật lý, khoảng lặng hoặc phản ứng không gian xen giữa các lượt thoại.",
                        "TFAM Pacing Rule: Weave Action into Dialogue",
                    )
                )
            consec_dialogue = []
    if len(consec_dialogue) >= 3:
        findings.append(
            _make_finding(
                chapter_id,
                "dialogue_pacing",
                "warning",
                " / ".join(consec_dialogue[:4]),
                f"Phát hiện {len(consec_dialogue)} dòng thoại ngắn liên tiếp (ping-pong dialogue) thiếu nhịp hành động.",
                "Chèn thêm cử chỉ vật lý hoặc phản ứng môi trường để giữ độ nặng tâm lý.",
                "TFAM Pacing Rule: Weave Action into Dialogue",
            )
        )

    # 5. Narrator over-explanation / walls of text
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", content) if p.strip()]
    for idx, p in enumerate(paragraphs, start=1):
        wc = len(p.split())
        if wc > 160:
            findings.append(
                _make_finding(
                    chapter_id,
                    "excessive_exposition",
                    "info",
                    p[:180] + "...",
                    f"Đoạn {idx} dài {wc} từ (vượt ngưỡng khuyến nghị 4–7 dòng), dễ tạo cảm giác wall-of-text / giải thích dày.",
                    "Tách thành 2–3 đoạn ngắn hơn, xen nhịp hành động hoặc đối thoại.",
                    f"Paragraph #{idx} ({wc} words)",
                )
            )
        for marker in TELL_EXPOSITION_MARKERS:
            if marker in p.lower():
                findings.append(
                    _make_finding(
                        chapter_id,
                        "narrator_over_explanation",
                        "info",
                        p[:200],
                        f"Người kể chuyện dùng cụm giải thích trực tiếp ('{marker}'), có nguy cơ cướp thoại/diễn giải hộ độc giả.",
                        "Để nhân vật bộc lộ qua hành động hoặc ẩn ý thay vì lời giải thích của narrator.",
                        f"Marker: '{marker}'",
                    )
                )

    # 6. Character Knowledge State & Timeline Continuity Violation Check
    for row in knowledge_rows:
        learned_ch = row.get("learned_chapter")
        # Fact is forbidden in this chapter if never learned OR learned in a strictly later chapter
        is_forbidden = learned_ch is None or int(learned_ch) > chapter_num
        if not is_forbidden:
            continue
        char_info = characters_by_id.get(row["character_id"], {})
        char_name = char_info.get("name", row["character_id"])
        try:
            keywords = json.loads(row.get("keywords_json") or "[]")
        except Exception:
            keywords = []
        for kw in keywords:
            if kw and kw.lower() in lower_content:
                m = re.search(re.escape(kw), content, re.IGNORECASE)
                excerpt = content[max(0, m.start() - 50): min(len(content), m.end() + 70)] if m else kw
                reveal_note = (
                    f"Chỉ được tiết lộ từ Chương {learned_ch}"
                    if learned_ch is not None
                    else "Chưa từng được tiết lộ trong canon"
                )
                findings.append(
                    _make_finding(
                        chapter_id,
                        "knowledge_state_violation",
                        "error",
                        excerpt,
                        f"VI PHẠM KIẾN THỨC NHÂN VẬT ({char_name}): Tại Chương {chapter_num}, nhân vật chưa thể biết '{row['fact_statement']}' (phát hiện từ khóa '{kw}').",
                        f"Gỡ chi tiết '{kw}' khỏi nhận thức của {char_name} ở Chương {chapter_num}, hoặc chỉ giữ ở mức tin đồn/nghi vấn không nêu đích danh.",
                        f"Knowledge ID: {row['id']} · {reveal_note}",
                    )
                )
                break

    # Build simple Before / After diff lines
    before_lines = content.splitlines()
    after_lines = suggested_text.splitlines()
    diff_preview = []
    max_len = max(len(before_lines), len(after_lines))
    for i in range(max_len):
        b = before_lines[i] if i < len(before_lines) else ""
        a = after_lines[i] if i < len(after_lines) else ""
        diff_preview.append({
            "line": i + 1,
            "before": b,
            "after": a,
            "changed": b != a,
        })

    return {
        "chapter_id": chapter_id,
        "chapter_number": chapter_num,
        "deterministic_findings": findings,
        "ai_assisted_status": "disabled_no_credentials",
        "ai_assisted_note": "Kiểm tra AI nâng cao đang tắt (chưa cấu hình AI_QA_API_KEY). Toàn bộ cảnh báo trên là kết quả kiểm tra tất định có dẫn chứng.",
        "before_after_preview": {
            "before_text": content,
            "suggested_text": suggested_text,
            "has_auto_suggestions": content != suggested_text,
            "lines": diff_preview,
        },
    }
