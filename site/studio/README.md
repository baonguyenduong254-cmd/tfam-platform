# TFAM Studio — Author Operating System

Ứng dụng **TFAM Studio** đầy đủ 14 module dành riêng cho tác giả **Leonardo Ravenna** (*Through Frost and Myth*), kèm Backend API lưu trữ thực (SQLite cục bộ & tương thích Cloudflare D1/Workers/R2).

## Chạy cục bộ ngay lập tức (không cần `npm install`)

Yêu cầu duy nhất: **Python 3.10+** (có sẵn SQLite 3).

```bash
python3 apps/api/local_server.py --port 8787
```

Sau đó mở trình duyệt tại: **http://127.0.0.1:8787**

### Tài khoản mặc định (Local Dev)
- **Owner (Toàn quyền duyệt xuất bản & quản trị):** `author@tfam.studio` / `tfam-studio-dev-pass`
- **Editor (Biên tập bản thảo & canon):** `editor@tfam.studio` / `editor-dev-pass`
- **Reader (Kiểm thử cổng trả phí Public API):** `reader@tfam.studio` / `reader-dev-pass`

## Chạy bộ kiểm thử tự động (End-to-End)

```bash
python3 tests/test_e2e.py
```

## 14 Module đã triển khai
- **I. Writing:** `01 Dashboard`, `02 Manuscript Editor` (autosave, lịch sử phiên bản, khôi phục, Contextual Inspector), `08 Narrative QA` (quy tắc TFAM + Before/After diff), `14 TFAM Data Importer` (DOCX/Markdown/JSON → hàng đợi kiểm duyệt).
- **II. Universe:** `03 Character Studio`, `04 Canon Database & Canon Graph`, `05 Timeline & Character Knowledge State`, `06 Worldbuilding Studio`, `07 War Room & What-if Sandbox`.
- **III. Publishing:** `09 Asset Library (Cloudflare R2)` (metadata, phát hiện orphan, không tự xóa R2), `10 Publishing Center` (Draft → Review → Approval → Immutable Snapshot + Rollback + `/api/public/*`).
- **IV. Business & Admin:** `11 Commerce Manager` (Sandbox Checkout & Entitlements), `12 Reader Analytics`, `13 System & Administration` (RBAC, Audit Log, Export DB Backup).

## Triển khai lên Cloudflare (Production)
Xem `wrangler.toml`, `apps/api/worker.ts` và `docs/TFAM_PLATFORM_PROGRESS.md` để áp dụng `database/migrations/0001_initial.sql` lên Cloudflare D1 và gắn subdomain `studio.<domain>`.
