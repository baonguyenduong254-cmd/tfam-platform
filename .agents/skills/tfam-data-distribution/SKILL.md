---
name: tfam-data-distribution
description: >-
  TFAM data distribution and ownership map across GitHub, ChatGPT Sites D1, Cloudflare R2 (tfam-assets), legacy Cloudflare Workers, and browser storage. Use before changing schemas, content, media URLs, or deployments.
---

# TFAM Data Distribution & Ownership Skill

Use this skill whenever deciding where TFAM code, content, media, reader progress, or secrets belong.

## 1. Four-Tier Ownership Matrix

| Layer | System | Owns | Must NOT Contain / Do |
| :--- | :--- | :--- | :--- |
| **Source & Contracts** | GitHub (`baonguyenduong254-cmd/tfam-platform`) | `site/` app code, Drizzle migrations (`site/drizzle/`), static UI assets (`site/public/`), R2 URL manifest (`site/lib/media/external-paths.json`), editorial contracts, `ops/` release records | Large raw media collections, DB dumps, reader PII, secrets/tokens |
| **Live Content & Users** | Production D1 (ChatGPT Sites managed `DB`) | Live `content` (`atlas` + `story:*` with `revision`), `studio_*` (`0005_tfam_studio_platform.sql`), `reader_accounts`, `reader_progress`, `chapter_comments`, `chapter_reactions`, `chapter_visits`, auth/rate-limit tables | Must NEVER be overwritten by seed JSON during a code deploy; never run destructive `DROP`/reset migrations |
| **Media Storage** | Cloudflare R2 (`tfam-assets`, `https://pub-a2e7030237c14362985465386fcae671.r2.dev`) | Canonical media bytes (`audio/soundtrack/`, `images/military/`, `images/monuments/`, `images/tfam-v239/`, `images/vestigium/`, `videos/`). Served via build-time `assetUrl()` mapping | DB backups, user PII, unmapped orphan files without updating `external-paths.json` |
| **Client State** | Browser `localStorage` | Ephemeral guest reading progress (`tfam-reading-history-v1`), UI prefs (`tfam-campaign-prefs`), Maison Vestigium `Imperial Vault` collector bag | Authoritative cross-device state (only claim synced after verified server account API success) |

## 2. Critical Environment Separation (Avoid Split-Brain)
- **Production Site (`throughfrostandmyth.baonguyenduong254.chatgpt.site`):** Hosted on ChatGPT Sites (`appgprj_6abf3718495481919a2cd6954776f57e`) with its own managed D1 (`revision: 32+`, `studio_published_snapshots`).
- **Personal Cloudflare Account (`3870e8dbe285cf415b0f56d0b8043547`):**
  - R2 `tfam-assets` **IS** actively used by production via public `r2.dev` URLs and CORS.
  - Worker `through-frost-and-myth.tfamatlas.workers.dev` and D1 `tfam-content` (`revision: 31`, `0` user rows) are **legacy/separate** from ChatGPT Sites—never confuse `tfam-content` with live production D1.

## 3. Data Sync Rules
1. **Media Sync (`R2` ↔ `GitHub`):** Whenever adding or retiring assets in `tfam-assets`, regenerate and commit `site/lib/media/external-paths.json` + `maintenance/` inventory before building `site/`. Verify referenced URLs (e.g. `/api/intro` video keys) actually exist in R2.
2. **Story & Unlock Sync (`D1` ↔ `Chronicles` ↔ `Achievements`):** `/api/story` serves chapters to `DiscoveryProvider`, which filters on `en_book*` and `complete: true`. Ensure English chapters exist in both `storyIndex` (`english-index.json`) and live D1 `content` so `/chronicles`, `/read/[id]`, and `/achievements` stay consistent.
3. **Code vs. Content Deploys:** Code deploys update Workers/Vinext bundles only; story/atlas content edits go through `/api/content`, `/api/story`, or Studio publish flows with optimistic `revision` checks.
