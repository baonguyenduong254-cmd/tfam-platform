# Reader accounts

GPT Sites uses the platform's existing ChatGPT sign-in and sign-out routes with normal top-level anchors. `getChatGPTUser()` supplies the trusted stable identity. The site remains public. This release does not add Google OAuth, email delivery, passwords or a separate authentication stack. A standalone Cloudflare deployment needs an independently configured trusted authentication integration before enabling accounts; the Sites sign-in routes are hosted platform capabilities.

`/api/account` returns only the current reader's profile/progress, not a directory. All writes require an authenticated platform identity, exact Origin, signed reader cookie and reader CSRF token. Account IDs are generated server-side and never selected from request bodies. Public names are self-chosen. The platform email is neither stored in the account table nor returned in public comments.

Avatars are limited to 72 existing bundled TFAM portrait IDs. The server validates this closed catalog; there is no image upload or arbitrary image URL. The picker reuses portrait assets and lazy loading. Existing native admin authentication and permissions remain separate from reader accounts.

Reading history and saved checkpoints are namespaced in device storage by profile ID and mirrored to D1. The newest timestamp wins during merging. Unsynced device history/checkpoints are retried on reconnect or a later page load; successful cloud data is available on another signed-in device. Save Progress remains an explicit button. Favourites and Read Later are account-owned chapter flags.

An explicit Import button adopts guest comments/reactions/view history from the current signed browser cookie and guest reading data from local storage. Claims preserve newer account reading progress, keep an existing account reaction when both identities reacted to a chapter, preserve total historical views, and are safe to repeat. Guest data is not silently adopted on sign-in.

Comments use the account name/avatar through a join; subsequent profile edits are reflected in them. Comment deletion uses the stable account owner identity across devices; anonymous deletion continues to use the browser cookie. Accounts do not confer admin access.

Migration 0003 adds reader_accounts, reader_progress, and a nullable account_id on existing comments. Older comments remain readable and claimable. No story text, author drafts or lore is changed.

Validation: TypeScript, `node scripts/check-reader-engagement.mjs`, and production build. The test exercises real API handlers with isolated SQLite, including native identity checks, CSRF, portrait allowlisting/assets, ownership isolation, cross-device data, current profile rendering, claims, sync conflicts and existing anonymous engagement. Actual browser/sign-in round-trip QA is unavailable in this session.

## Registration IP quota

New TFAM profiles are limited to three per edge-provided IP, with no time reset. A nullable indexed registration_ip column stores a domain-separated HMAC, never the raw address. The SQL check and insert are one atomic statement; updates retain the original registration address and remain available at the quota. Existing profiles pre-dating this migration remain usable but cannot be attributed retroactively. Missing/invalid edge IP fails closed for new profiles. Forwarded headers supplied by clients are ignored. IPv6 text is canonicalized before hashing. Shared networks share this quota; switching networks/VPNs can bypass IP-only controls. Rotating the existing reader HMAC secret also changes quota hashes; retain that secret or plan quota migration before rotating it.

Email registration/OTP and external Google OAuth are NOT implemented by this update. The hosted Sites authentication contract supports native ChatGPT identity, with no exposed external-provider configuration. A standalone deployment needs a supported external identity provider plus verified email delivery, registered callback URLs and securely configured credentials before those options can be enabled. Do not add decorative login buttons or simulated verification codes. Google sign-in performs provider verification; an email OTP from TFAM requires an email sender rather than Google's sign-in verification flow.
