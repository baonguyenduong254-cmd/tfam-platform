"""
Module 14: TFAM Data Importer (DOCX, Markdown, JSON -> Staging Queue)
Parses uploaded documents natively without third-party dependencies (zipfile + xml.etree for DOCX).
Extracts chapters and candidate entities into `import_staging` for explicit Author Review.
NEVER auto-commits directly to Canon without author approval.
"""

from __future__ import annotations
import base64
import io
import json
import re
import xml.etree.ElementTree as ET
import zipfile
from typing import Any, Dict, List


CHAPTER_HEADING_RE = re.compile(
    r"^(?:#{1,3}\s*)?(?:Chương|Chapter)\s+(\d+)\s*[:\-–—.]?\s*(.*)$",
    re.IGNORECASE,
)

PROPER_NAME_RE = re.compile(
    r"\b([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯ][a-zàáâãèéêìíòóôõùúăđĩũơư]+(?:\s+[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯ][a-zàáâãèéêìíòóôõùúăđĩũơư]+){1,2})\b"
)

STOP_PHRASES = {
    "Chương", "Chapter", "Poster Arc", "The World", "Castilian Empire",
    "Western Roman", "North Africa", "Royal Guard",
}


def extract_text_from_docx_bytes(raw_bytes: bytes) -> str:
    """Extract paragraph text from a .docx binary archive using stdlib zipfile + XML."""
    with zipfile.ZipFile(io.BytesIO(raw_bytes)) as zf:
        if "word/document.xml" not in zf.namelist():
            raise ValueError("Invalid DOCX archive: missing word/document.xml")
        xml_data = zf.read("word/document.xml")

    root = ET.fromstring(xml_data)
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    paragraphs: List[str] = []
    for p in root.findall(".//w:p", ns):
        texts = [t.text for t in p.findall(".//w:t", ns) if t.text]
        line = "".join(texts).strip()
        if line:
            paragraphs.append(line)
    return "\n\n".join(paragraphs)


def parse_import_payload(
    filename: str,
    source_format: str,
    text_content: str = "",
    base64_content: str = "",
) -> List[Dict[str, Any]]:
    """
    Parse DOCX, Markdown, or JSON into staging items.
    Returns a list of candidate staging records ready for `import_staging`.
    """
    fmt = source_format.lower().strip()
    if fmt == "docx":
        if not base64_content:
            raise ValueError("DOCX import requires base64_content")
        raw = base64.b64decode(base64_content)
        full_text = extract_text_from_docx_bytes(raw)
        return _extract_chapters_and_entities(filename, "docx", full_text)

    if fmt == "json":
        raw_str = text_content or (base64.b64decode(base64_content).decode("utf-8") if base64_content else "")
        data = json.loads(raw_str)
        items = data if isinstance(data, list) else [data]
        staged: List[Dict[str, Any]] = []
        for idx, item in enumerate(items, start=1):
            target_type = item.get("target_type", "canon")
            if target_type not in ("chapter", "character", "canon", "timeline"):
                target_type = "canon"
            title = item.get("title") or item.get("name") or f"Imported JSON Entry #{idx}"
            staged.append({
                "source_filename": filename,
                "source_format": "json",
                "target_type": target_type,
                "extracted_title": title,
                "extracted_payload": item,
            })
        return staged

    # Default: Markdown / plain text
    full_text = text_content or (base64.b64decode(base64_content).decode("utf-8") if base64_content else "")
    return _extract_chapters_and_entities(filename, "markdown", full_text)


def _extract_chapters_and_entities(filename: str, fmt: str, full_text: str) -> List[Dict[str, Any]]:
    lines = full_text.splitlines()
    chapters: List[Dict[str, Any]] = []
    current_ch: Dict[str, Any] | None = None

    for line in lines:
        m = CHAPTER_HEADING_RE.match(line.strip())
        if m:
            if current_ch:
                chapters.append(current_ch)
            ch_num = int(m.group(1))
            ch_title_rest = m.group(2).strip()
            full_title = f"Chương {ch_num}: {ch_title_rest}" if ch_title_rest else f"Chương {ch_num}"
            current_ch = {
                "chapter_number": ch_num,
                "title": full_title,
                "lines": [],
            }
        else:
            if current_ch is None and line.strip():
                current_ch = {
                    "chapter_number": 999,
                    "title": f"Imported Draft — {filename}",
                    "lines": [line],
                }
            elif current_ch is not None:
                current_ch["lines"].append(line)

    if current_ch:
        chapters.append(current_ch)

    staged: List[Dict[str, Any]] = []
    entity_counts: Dict[str, int] = {}

    for ch in chapters:
        body = "\n".join(ch["lines"]).strip()
        wc = len(body.split())
        staged.append({
            "source_filename": filename,
            "source_format": fmt,
            "target_type": "chapter",
            "extracted_title": ch["title"],
            "extracted_payload": {
                "chapter_number": ch["chapter_number"],
                "title": ch["title"],
                "content": body,
                "word_count": wc,
                "language": "vi",
            },
        })
        for nm in PROPER_NAME_RE.findall(body):
            if nm not in STOP_PHRASES and not nm.startswith("Chương "):
                entity_counts[nm] = entity_counts.get(nm, 0) + 1

    # Propose top recurring proper names as candidate Character/Canon review items
    top_entities = sorted(entity_counts.items(), key=lambda kv: (-kv[1], kv[0]))[:6]
    for name, count in top_entities:
        if count >= 2:
            staged.append({
                "source_filename": filename,
                "source_format": fmt,
                "target_type": "character",
                "extracted_title": f"[Đề xuất nhân vật] {name} ({count} lần xuất hiện)",
                "extracted_payload": {
                    "name": name,
                    "biography": f"Được trích xuất tự động từ tệp {filename} ({count} lần nhắc). Cần tác giả duyệt trước khi đưa vào Canon.",
                    "mentions_in_import": count,
                },
            })

    return staged
