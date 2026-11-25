---
name: tfam-github-management
description: >-
  Manage GitHub branches, pull requests, release synchronization, and documentation hygiene for baonguyenduong254-cmd/tfam-platform so main stays aligned with live production.
---

# TFAM GitHub Management & Release Sync Skill

Use this skill when inspecting, organizing, merging, cleaning up, or documenting changes in `baonguyenduong254-cmd/tfam-platform`.

## 1. Repository & Sync Principles
- **Repository:** `baonguyenduong254-cmd/tfam-platform` (`site/` contains the Vinext/Next.js 16 application).
- **`main` Must Reflect Live Production:** Never leave deployed changes stranded on unmerged task branches. Whenever a deployment to `https://throughfrostandmyth.baonguyenduong254.chatgpt.site` succeeds, merge the verified branch into `main` promptly and update `ops/status.json` + `ops/releases/<ver>-source.json`.
- **One Active Branch Per Area:** Use `task/<topic>` for features/fixes and `maintenance/<topic>` for cleanup/retirement. Close or merge superseded PRs immediately.

## 2. Release & Provenance Checklist
Every production release PR must record in `ops/releases/<ver>-source.json` and `ops/status.json`:
1. `siteVersion`, `deploymentId`, `versionId`, and live `url`.
2. `githubCommit`, `githubBranch`, `sourceCommit`, `sourceTree`, and `archiveHash`.
3. `rollback` target (`siteVersion`, `deploymentId`, `versionId`).
4. Verification scope (`tsc --noEmit`, production build, desktop `1280`/`1920` and mobile `390` checks, console/network status).

## 3. Documentation & `.md` Hygiene
- Keep root docs concise and current: `README.md`, `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, and `docs/ARCHITECTURE.md`, `docs/DATA-FLOWS.md`, `docs/WORKFLOW.md`, `docs/AI-OPERATING-WORKFLOW.md`.
- Do **not** accumulate dated `checkpoint.md` / `update-201..249` files across `docs/` and `site/docs/` once an update is superseded. Archive historical checkpoints under `docs/archive/` or retire confirmed obsolete notes in a dedicated `maintenance/` PR (logging retired paths in `maintenance/retirement-register.json`).
- Keep `README.md`, `ops/connections.json`, and `ops/status.json` synchronized on the same version number—never leave conflicting version claims (`v210`, `v225`, `v241`, `v250`).

## 4. Safety Rules
- Never commit secrets, API tokens, `.env` values, or `auth.json`.
- Never force-push `main` or rewrite shared history.
- Before deleting any file, verify no build script (`site/package.json`), runtime route, or `external-paths.json` entry references it.
