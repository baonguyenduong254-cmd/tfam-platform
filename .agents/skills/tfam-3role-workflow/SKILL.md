---
name: tfam-3role-workflow
description: >-
  Orchestrate the 3-role TFAM development workflow across Owner/Architect (baonguyenduong254, Paid Pro full models), Worker (leonardoravennax, Trial Pro hydrogen), and Supervisor (Codex Plus via MCP). Use when dispatching tasks to Ravenna, reviewing PRs with Codex, or deciding who handles a task.
---

# TFAM 3-Role Workflow (Owner · Worker · Supervisor)

## 1. Role Boundaries
1. **Owner & Chief Architect (`baonguyenduong254@gmail.com` — Paid Pro, full models):**
   - Designs architecture, solves complex bugs/hydration/WebGL issues, authors exact implementation blueprints (GitHub Issues), runs Supervisor reviews, previews locally, and holds sole authority to merge `main` or publish.
   - **Never burn Paid Pro quota on repetitive copy/test/JSON/translation labor** — delegate packaged work to Worker.
2. **Worker (`leonardoravennax@gmail.com` — Trial Pro, `hydrogen`):**
   - **Never give open-ended design briefs.** Work strictly from an Owner-authored blueprint/GitHub Issue listing exact target files, design tokens (`tfam-web-design`), constraints, and verification commands.
   - Best tasks: executing clear specs, translating copy, syncing JSON/manifests, writing unit tests from existing patterns, fixing concrete `file:line` review items, running `tsc --noEmit`, `pnpm run build`, and `node --test`, and opening a PR (`task/<issue>-<slug>`).
   - Never commits directly to `main`; max **2 fix rounds** per PR before escalating hard blockers back to Owner.
3. **Construction Supervisor (`Codex Plus` — MCP `codex` with `account: "plus"` or `"default"`):**
   - Mandatory independent `read-only` gatekeeper between Worker PRs and `main`.
   - Reviews PR diffs against `AGENTS.md`, `tfam-web-design`, and the source Issue, returning a strict `PASS` or `FAIL` with exact `file:line` findings.

## 2. Standard 4-Step Dispatch Loop
1. **Architect (Owner):** Create a GitHub Issue (or use TFAM 3-Role Control Center at `http://127.0.0.1:4310`) with explicit `File Scope`, `Forbidden Files`, `Spec`, and `Checks`.
2. **Build (Worker - Ravenna):** Pull `main`, branch `task/<issue>-<slug>`, implement only within `File Scope`, run `tsc --noEmit` + `pnpm run build` + `node --test tests/*.test.mjs`, and open a PR referencing `Closes #<issue>`.
3. **Inspect (Supervisor - Codex Plus):** Call `codex_run` / `codex_review` (`sandbox: "read-only"`, `account: "plus"`) against the PR diff.
   - If `FAIL`: post findings as PR comments and send back to Ravenna for Round 2 (max 2 rounds; escalate to Owner if still blocked).
4. **Sign-Off & Merge (Owner):** Verify local preview (`http://127.0.0.1:8787`), merge PR into `main`, delete task branch, and update `ops/status.json`.
