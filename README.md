# TFAM Platform

Central repository for **Through Frost and Myth** (`baonguyenduong254-cmd/tfam-platform`).

## Current Production State (v250)
- **Live URL:** https://throughfrostandmyth.baonguyenduong254.chatgpt.site
- **Hosting:** OpenAI ChatGPT Sites (`appgprj_6abf3718495481919a2cd6954776f57e`) — `siteVersion: 250`
- **Active Source:** `site/` (Next.js 16.3.4 / React 19 / Vinext `1.0.0-beta.5` / Vite 8)
- **Media CDN:** Cloudflare R2 bucket `tfam-assets` (`https://pub-a2e7030237c14362985465386fcae671.r2.dev`)
- **Database:** Production D1 (`DB` binding: `content`, `studio_*`, `reader_accounts`, `reader_progress`, `chapter_*`)

## Repository Structure
- `site/` — Web application, Drizzle migrations, static assets, media manifest (`site/lib/media/external-paths.json`), and build/validation scripts
- `docs/` — Architecture, data flows, operating workflow, and v250 reboot notes
- `ops/` — Connection registry (`ops/connections.json`), live status (`ops/status.json`), and release records (`ops/releases/`)
- `maintenance/` — R2 media audits and retirement logs
- `.agents/skills/` — Agent workflows (`tfam-web-design`, `tfam-github-management`, `tfam-data-distribution`, `tfam-update-workflow`, `tfam-media-production`, `tfam-web-research`, plus vendored design/testing skills)

## Working Workflow
1. Read `AGENTS.md`, `ops/status.json`, and `docs/ARCHITECTURE.md` before starting changes.
2. Develop and validate on a `task/<topic>` or `maintenance/<topic>` branch.
3. Deploy verified `site/` changes to ChatGPT Sites, record provenance in `ops/releases/`, and merge the PR into `main` so `main` stays synchronized with production.
