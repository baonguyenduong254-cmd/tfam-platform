---
name: TFAM Worker Blueprint
about: Blueprint authored by Owner/Architect (baonguyenduong254) for Worker (leonardoravennax) & Codex Supervisor
---

## Blueprint (Authored by Owner: baonguyenduong254)
**Assigned Worker:** `leonardoravennax` (Trial Pro / `hydrogen`)
**Mandatory Reviewer:** `Codex Plus` (MCP read-only audit before merge)
**Skill:** `tfam-web-design`

### Objective & Exact Spec
- 

### Allowed File Scope
- 

### Forbidden Files / Constraints
- Do not push directly to `main`. Do not touch D1/R2 production data. Max 2 fix rounds after Codex review.

### Verification Checklist (Must pass before opening PR)
- [ ] `tsc --noEmit` exits `0`
- [ ] `pnpm run build` exits `0`
- [ ] `node --test tests/*.test.mjs` verified
- [ ] PR opened referencing `Closes #<issue>`
