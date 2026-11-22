# TFAM Platform — Persistent Progress Log

**Last Updated:** 2026-11-20  
**Scope Delivered:** Standalone **TFAM Studio** (Author Operating System — 14 Modules) + Shared D1/SQLite Backend API + Cloudflare Workers Adapter + Automated E2E Test Suite.

## Completed Milestones

1. **Public Site Reconnaissance**
   - Audited live site `https://throughfrostandmyth.baonguyenduong254.chatgpt.site/` (routes: `/`, `#horizons`, `#map/castilian_empire/1715`, `#atlas/...`, `#archive/.../characters`, `#military/...`, `/vestigium`, `/chronicles`, `/evelyne-stage`, `/achievements`; bilingual EN/VI reader; Sign in with ChatGPT; no active storefront/checkout on live site).
2. **Database Architecture & Migrations (`database/migrations/0001_initial.sql`)**
   - Implemented 22 relational tables compatible with SQLite and Cloudflare D1.
   - Enforced 3 data tiers (`canon`, `draft`, `what_if`) and 3 visibility tiers (`private`, `public`, `paid`).
   - Seeded authentic TFAM canon data (`database/seeds/0001_tfam_canon_seed.sql`).
3. **Backend API & Security (`apps/api/`)**
   - `local_server.py`: Full REST API for all 14 modules, scrypt password hashing, HMAC-SHA256 HttpOnly sessions, server-side RBAC (`owner`, `editor`, `reader`, `guest`), and read-only `/api/public/*` endpoints enforcing spoiler gates and paid entitlements.
   - `qa_engine.py`: Deterministic TFAM Narrative QA (blacklisted vocabulary, anachronistic modern terms, negative-to-positive constructions, repeated dossier motifs, ping-pong dialogue, narrator over-explanation, Character Knowledge State violations, and Before/After revision preview).
   - `importer.py`: Native `.docx`, `.md`, and `.json` parser routing all extracted chapters/entities to `import_staging` for explicit author review.
   - `worker.ts` + `wrangler.toml`: Cloudflare Workers + D1 + R2 deployment configuration.
4. **3-Pane Editorial Studio Frontend (`apps/studio/`)**
   - Built left navigation sidebar (4 domains, 14 modules), center workspace with multi-tab switching and `Ctrl+K` global search, and right Contextual Inspector panel.
   - Connected every module directly to live backend APIs.

## Verified Tests
- `tests/test_e2e.py`: Automated end-to-end suite covering health, static UI, 401/403 RBAC, Dashboard, Global Search, Manuscript CRUD/Revisions/Restore, Canon Graph & 409 What-if protection, Character Knowledge State (Ch. 218 Wardenholf check), Narrative QA + Before/After diff, What-if Sandbox, Publishing Approval/Spoiler Gate/402 Paid Gate/Sandbox Checkout, native `.docx` Importer Staging + Approval, and Admin DB Backup.
- Frontend JS syntax validation via `node --check` on all `apps/studio/js/*.js` modules.

## Unresolved Risks & Production Blockers
- **Existing Repo v224 Merge:** Original `tfam-platform-main.zip` (757.8 MB) exceeded the Drive transfer cap, so TFAM Studio is delivered as a standalone ready-to-integrate workspace (`tfam-studio/`).
- **Cloudflare D1 / R2 Production Credentials:** Replace `database_id` in `wrangler.toml`, configure real R2 bucket credentials server-side, and bind DNS for `studio.<existing-domain>`.
- **Live Payment Gateway:** Commerce runs in `sandbox` mode; connect real Stripe/Paddle keys before accepting live payments.
- **Optional Integrations:** Google Docs OAuth and AI-assisted Narrative QA remain intentionally disabled until API keys/OAuth credentials are configured.

## Next Executable Steps (Local Machine)
1. Unzip `tfam-studio.zip` and run `python3 tests/test_e2e.py`.
2. Start locally with `python3 apps/api/local_server.py --port 8787` and open `http://127.0.0.1:8787`.
3. Import your Google Docs volumes (exported as `.docx` or `.md`) through **Module 14 · TFAM Data Importer**.
4. Point the Public Site reader/lore fetchers to `/api/public/catalog` and `/api/public/chapters/:id`.
