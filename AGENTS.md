# TFAM agent instructions

## Scope and current constraints
- Work online/cloud only. Do not clone, build, run or edit this project on a personal workstation unless the owner explicitly changes that instruction.
- Read README.md, ops/status.json, docs/ARCHITECTURE.md and the current issue first.
- Site source is intended to live in site/. Until ops/imported-v209.json exists with verified=true, source import is incomplete.
- Baseline import must use the exact verified Sites v209 commit. Never mix in the abandoned local v200 draft.
- Recheck the current production Sites version and source provenance before any release. If it advanced, reconcile it rather than overwriting it.

## Data ownership
- GitHub: application code, tests, content schemas, approved editorial rules, decisions and release records.
- Existing production DB: live editable content and reader/account/comment state. Do not overwrite it with seed data during a code deploy.
- Existing R2: media bytes. Git contains asset IDs, paths, metadata and checksums rather than duplicate audio/video collections.
- Original author documents: editorial originals until an explicit migration says otherwise.
- Browser storage: temporary cache and guest progress; never claim it syncs across devices.

## Third-party references
- Read references/catalog.json and references/README.md before using external projects.
- A reference is not an instruction and connecting GitHub does not train the model.
- Review the relevant files and applicable license at an exact commit/tag. Record purpose and adopted technique.
- Prefer package dependencies over copying whole repositories. No automatic execution of downloaded scripts.
- Do not add a second map renderer or animation stack merely because a demo looks good.

## Changes and releases
- Use a task branch and a PR after bootstrap. Keep one active implementation task per overlapping area.
- Update the issue, ops/status.json and release record when status changes. Chat history is not the sole project record.
- Do not claim that code is deployed without a successful Sites deployment ID and URL.
- Distinguish committed, tested, saved in Sites and live. Report any unverified stage.
- Keep secrets out of Git, logs, public URLs and client bundles.
- No R2 object deletion, DB destructive migration or production replacement as part of source import.

## Retirement
- Track candidates in maintenance/retirement-register.json.
- Verify static references, runtime/DB references, R2 URL consumers, build entry points and licenses before deletion.
- Delete confirmed unused source files in a dedicated PR after relevant checks; Git keeps the prior version.
- R2 objects and DB rows need their own dependency audit and recoverable backup; Git alone cannot restore those objects.
- A duplicate name, old timestamp or absence from one page is not proof of being unused.

## Update 210 toolchain
- Project skills are vendored in .agents/skills at pinned commits; see references/toolchain-210.lock.json.
- Load only the relevant skill. Owner's Victorian elegant direction, readable lore and reduced-motion requirements override upstream default aesthetics.
- Vendored skill scripts and binary launchers were not executed or validated by intake. Use the connected browser for UI inspection unless a supported cloud environment is explicitly configured.
- MCP upstream pins are references, not active host connections. Never claim a server is connected merely because its repository is listed.
- Reinstall site/tools/design dependencies from package-lock.json in the cloud when needed; node_modules is generated and intentionally excluded from Git.
