# Update211 release and rollback

Intended label211. Latest saved/live version rechecked2026-11-04 06:11GMT+7:210, deployment appgdep_6ae9248a291c8191a63c76e06d9f8e79, source7ebfd779b0445b35ff5b527c8d0b1aed6e0a8bab. GitHubmain recheckedc3c091157ea2330ea63d93568d7cebd56a7e2eff. Recheck immediately before saving; do not overwrite newer work.

Owner originally required review before merge/deploy. New instruction2026-11-04: continue interface work, start finalQA at06:30 local time, then push to site. This authorizes release after important checks pass. Preserve the existing public audience and Site identity. No production DB seed/reset, destructive migration, environment-variable replacement or R2 deletion.

## Release

1. Run final local TypeScript/domain/build and real browser smoke on the built application, including staticAtlas, disclosure locks, dossier/Back/reader behavior and mobile layout. Record actual results and limits in TEST-RESULTS.md.
2. Review and merge implementation PR, then its dedicated source-retirement PR. No cloud build workflow is triggered for task/update-211; local execution is the authorized environment.
3. Use the existing Sites source repository with short-lived credential through hidden stdin only. Open an isolated publish checkout at verified210; reconcile if upstream advanced. Synchronize exact site/ source, preserving .openai/hosting.json. Copy the tested dist output; never include .dev.vars, .env, local DB, .wrangler, node_modules, screenshots or temporaryfixtures in the deployment archive.
4. Commit/push source with Sites helper, package verified output, save next available version through native Sites, then deploy to the existing public audience. Keep source commit, archive hash, saved version/deployment IDs. Only a successful native deployment result is a live-release claim.
5. Verify the live firstviewport and key read-only routes; no production progress/account/comment writes during smoke. Update issue21, ops/status.json and release provenance.

## Rollback

Redeploy the retained archive-backed210 version appgprj_6abf3718495481919a2cd6954776f57e~appgver_aab97b86f8608191bb5a23fd3d47aa8f if211has a critical regression. Reverting application source alone is not a deployment. Data needs no rollback because211adds no production data migration/reset. R2originals remain intact. Revert the two GitHubPRs in reverse order only if source rollback is required.

## Outstanding assets / hardware limits

See IMAGE-QUALITY.md for measured source-resolution ceilings and Madrid derivative provenance. No fabricated UHD claim; no fake3Drotation. Safari, realtouch, mobileGPU60FPS and authenticated production-sync/comment posting are not established by desktopEdge testing. No video-recording capability was available.
