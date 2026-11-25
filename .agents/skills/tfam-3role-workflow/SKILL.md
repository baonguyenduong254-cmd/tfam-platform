---
name: tfam-3role-workflow
description: >-
  Orchestrate the TFAM development workflow across Remote Orchestrator (baonguyenduong254, Paid Pro), Local Execution Workers (leonardoravennax Trial hydrogen & Zed Student IDE), and OpenAI Codex (Plus until 2026-12-01, then Business: Site Sync, Image Generation, and Technical Supervision). Use when dispatching tasks, handing off across machines, reviewing PRs, or syncing production.
---

# TFAM Multi-Tool Orchestration Workflow

## 1. Single Source of Truth (Cross-Machine Sync: Company PC · Personal PC · Home Laptop)
- Never keep active state only in local chat history or an unpushed local folder.
- **GitHub (`baonguyenduong254-cmd/tfam-platform`):** owns code, `.agents/skills/*`, `AGENTS.md`, `GitHub Issues`, `Pull Requests`, `ops/status.json`, and **`ops/handoff.json`** (cross-machine session handoff ledger).
- **Cloudflare R2 (`tfam-assets`) & ChatGPT Sites D1 (`rev 32`):** own production media and live editable data.
- **Company PC rule:** Operate browser-only (`antigravity.google.com`, `chatgpt.com/codex`, `github.com`) without needing local clones.
- **Home Laptop / Personal PC rule:** Pull `main` at session start (`git pull`), always push work-in-progress to a `task/*` branch or Draft PR before ending a session, and update `ops/handoff.json`.

## 2. Role & Tool Ownership
1. **Orchestrator / Owner (`baonguyenduong254@gmail.com`, Gemini Paid Pro — Remote Agent):**
   - Runs remotely via `antigravity.google.com` across all machines.
   - Designs architecture, solves complex bugs/hydration/performance problems, writes exact GitHub Issue blueprints (`File Scope`, `Forbidden Files`, `Spec`, `Verification`), reviews Supervisor findings, and holds sole authority to merge `main`.
2. **Worker A (`leonardoravennax@gmail.com`, Gemini Trial Pro `hydrogen` — Local):**
   - Executes packaged, bounded Issues only (copy/translation, JSON/manifests, CSS tokens from `tfam-web-design`, unit tests from existing patterns, `file:line` review fixes).
   - Never improvises architecture or pushes directly to `main`. Max **2 fix rounds** per PR before escalating blockers to Orchestrator.
3. **Worker B (`Zed Student` — Local IDE on Personal PC & Home Laptop):**
   - Reads `AGENTS.md` automatically from repo root; used for fast multi-file local editing, local `pnpm run build` / `pnpm run start` verification, and PR creation.
4. **Specialist & Supervisor (`Codex Plus` until `2026-12-01` → `Codex Business`, `chatgpt.com/codex`):**
   - **Technical Supervision:** Mandatory `read-only` audit of Worker/Zed PR diffs against `AGENTS.md` and `tfam-web-design` (`VERDICT: PASS` or `FAIL` with `file:line`).
   - **Image Generation:** Generates TFAM-styled artwork (`Royal · Obsidian/Brass/Crimson`) for upload to R2 `tfam-assets`.
   - **ChatGPT Sites Sync & Publish:** Syncs verified `site/` from `main` to `appgprj_6abf3718495481919a2cd6954776f57e` (`throughfrostandmyth.baonguyenduong254.chatgpt.site`) — verify active workspace (Personal vs Business) when publishing after `2026-12-01`.

## 3. Standard Dispatch Loop
1. **Blueprint (`baonguyenduong254` Remote):** Open GitHub Issue (`File Scope`, `Forbidden`, `Checks`) + update `ops/handoff.json`.
2. **Execute (`leonardoravennax` or `Zed Student` Local):** Pull `main`, branch `task/<issue>-<slug>`, implement, pass `tsc --noEmit` + `pnpm run build` + `node --test tests/*.test.mjs`, open PR referencing `Closes #<issue>`.
3. **Supervise (`Codex` Cloud/MCP):** Audit PR diff (`PASS/FAIL`). If `FAIL`, post findings to PR comments for Worker fix (max 2 rounds).
4. **Merge & Publish (`baonguyenduong254` + `Codex` Sites):** Merge PR into `main`, update `ops/status.json` & `ops/handoff.json`, then trigger Codex Sites sync from `main`.
