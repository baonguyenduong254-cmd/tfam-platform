# Reader engagement

The reading library and standalone reading room share `/api/engagement` and `/api/engagement/:id`. Counters start when this release is deployed; historical page views are not fabricated. Total views means the sum of chapter views, across Vietnamese and English editions of the same chapter ID.

A view is requested after ten seconds with the document visible and the editor closed. An atomic SQLite upsert admits at most one view per chapter and signed browser identity per rolling 24 hours. Counts are approximate reading visits, not verified unique people. Clearing cookies or switching devices creates another identity.

The signed `__Host-tfam_reader` cookie is Secure, HttpOnly, SameSite=Lax and lasts one year. Its database key is a SHA-256 digest. Signing uses the existing server-only admin password verifier as HMAC key, with reader-specific domain separation. No new secret is stored in source. Changing that verifier resets anonymous identities; it does not delete existing public comments or totals.

One reaction per browser and chapter can be replaced or cleared. Public comments have a self-chosen display name, 2–2,000 characters, and newest-first cursor pagination. Comment text is rendered as React text, never HTML. Names are not verified. Writers can delete their own comments with the same browser cookie. Existing authenticated administrators can delete all comments. All mutations require exact Origin, signed reader cookie and a reader CSRF token. Parameterized SQL, a streaming 10 KB request limit and atomic IP-HMAC rate limits bound writes. Expired rate buckets are pruned in bounded batches; raw IP addresses are not persisted.

Migration `0002_worried_miek` appends four tables and two indexes; it does not alter story or content tables. Sites applies this migration during deployment. An external Cloudflare deployment must apply the same Drizzle migration to its D1 database and preserve the existing admin environment variables.

Validation: `node scripts/check-reader-engagement.mjs` executes the actual TypeScript route handlers with an isolated SQLite-backed D1 adapter. It covers origin/CSRF/cookie checks, view deduplication and expiry, totals, reactions, public comment serialization, ownership/admin deletion, pagination, rate limits and request bounds. TypeScript and the production build are also required. Browser QA is unavailable in this managed session.
