# Local Worker Runbook: Activate Standalone Cloudflare Workers + Personal D1 (`v273`)

> **Target Agent:** Antigravity Local (`leonardoravennax`) on Personal PC / Home Laptop.
> **Goal:** Deploy **Through Frost and Myth** independently onto the owner's personal Cloudflare Workers + personal D1 (`tfam-content`) + R2 (`tfam-assets`) so the public URL is no longer tied to `*.chatgpt.site`, and enable automatic GitHub Actions deploys on every merge to `main`.

## Rules
- Never print, log, or commit any Cloudflare API token or secret into Git.
- Do **not** delete R2 objects or run destructive D1 migrations.
- Work from a clean `main` checkout (`git pull --ff-only origin main`).

---

## Step 1 — Sync latest `main`
```bash
git checkout main
git pull --ff-only origin main
```
Verify these two files exist:
- `.github/workflows/deploy-cloudflare.yml`
- `site/scripts/prepare-cloudflare-deploy.mjs`

---

## Step 2 — Check Cloudflare CLI (`wrangler`) & Get Personal D1 UUID
```bash
cd site
npx wrangler whoami
```
- If not logged in, run `npx wrangler login` and ask the owner to click **Allow** in the browser once.
- Once authenticated, list D1 databases to grab the UUID of `tfam-content`:
```bash
npx wrangler d1 list
```
Record:
- `CLOUDFLARE_ACCOUNT_ID` = `3870e8dbe285cf415b0f56d0b8043547` (verify it matches `wrangler whoami`)
- `CLOUDFLARE_D1_DATABASE_ID` = `<uuid of tfam-content from wrangler d1 list>`

---

## Step 3 — First Immediate Deploy from Local (Instant Public URL)
Run inside `site/`:
```bash
pnpm install --frozen-lockfile
pnpm run build
CLOUDFLARE_D1_DATABASE_ID="<paste-tfam-content-uuid>" node scripts/prepare-cloudflare-deploy.mjs
npx wrangler deploy --config dist/server/wrangler.cloudflare.json
```
- Copy the live public URL printed by `wrangler deploy` (e.g. `https://through-frost-and-myth.<subdomain>.workers.dev`).

---

## Step 4 — Verify the Standalone Live Site
Check these 4 URLs on the newly deployed `workers.dev` domain (HTTP 200, 0 console errors):
1. `/` (Landing & Overview with v271 motion + scroll rail)
2. `/#atlas/castilian_empire/1715` (Open 3-Act Multi-Theatre Atlas: Grand + Europe + Asia)
3. `/chronicles` (Arc I shows 40 chapters linking to `/read/en_book1_final_001`)
4. `/read/en_book1_final_001` (Chapter 1 loads cleanly; `/read/en_book1_001` redirects to `/read/en_book1_final_001`)

---

## Step 5 — Enable Automatic GitHub Actions Deploy on Every `main` Merge
Set the 3 GitHub repo secrets via `gh`:
```bash
gh secret set CLOUDFLARE_ACCOUNT_ID --body "3870e8dbe285cf415b0f56d0b8043547"
gh secret set CLOUDFLARE_D1_DATABASE_ID --body "<paste-tfam-content-uuid>"
```
For `CLOUDFLARE_API_TOKEN`:
- Ask the owner to create a Cloudflare API Token (template: **Edit Cloudflare Workers** + add **Account → D1 → Edit** permission) at `https://dash.cloudflare.com/profile/api-tokens`, then set it securely:
```bash
gh secret set CLOUDFLARE_API_TOKEN
```
Trigger a test run of the workflow to confirm end-to-end cloud auto-deploy:
```bash
gh workflow run deploy-cloudflare.yml
gh run watch
```

---

## Done Criteria
- Standalone Cloudflare Workers URL is live and verified (all 4 routes return 200).
- GitHub Actions workflow `Deploy TFAM to Cloudflare Workers` succeeds end-to-end.
- Report the live `workers.dev` URL (and optional Custom Domain next step) back to the owner.
