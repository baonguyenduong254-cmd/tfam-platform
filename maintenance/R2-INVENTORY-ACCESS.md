# R2 inventory access for update 210

Bucket verified in dashboard: tfam-assets.
The dashboard session was readable but full pagination did not complete. No object has been deleted.

## Concrete cloud inventory job
Use a bucket-scoped Object Read credential for tfam-assets only. The job will list keys, sizes and ETags and read selected objects for checksum comparison. It must have no Object Write permission.
Store access-key ID and secret only in GitHub Actions Secrets named TFAM_R2_READ_ACCESS_KEY_ID and TFAM_R2_READ_SECRET_ACCESS_KEY. Do not put them in chat or Git.
Endpoint: https://3870e8dbe285cf415b0f56d0b8043547.r2.cloudflarestorage.com

Compare the full inventory against:
- site/lib/media/external-paths.json (2,341 mapped images, all with static source consumers in initial audit);
- audio/video catalogues, generated paths and build-time consumers;
- current published content from D1/API;
- approved backup/archive retention.

Save keep/candidate/delete manifests with evidence. An object absent from one list is not safe to delete.
No permanent deletion until the complete manifest is available, backup/recovery is verified, and the exact deletion set has been confirmed at action time.

## Remaining development tools
Four project skills are in .agents/skills. They do not activate host MCP connections.
Playwright MCP and Chrome DevTools MCP upstream commits are pinned in references/toolchain-210.lock.json; runtime activation still needs a supported cloud agent environment.
