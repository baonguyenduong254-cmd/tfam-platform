# TFAM v265 Design Blueprint — Horizon × Orizon Portal Polish (Local Execution Spec)

> **Role Handoff:** Authored by Remote Orchestrator (`baonguyenduong254`) on top of `origin/main` (`810bf89`, v264).
> **Executor:** Local Worker (`leonardoravennax` / `Zed Student` / Antigravity Local).
> **Branch naming:** Create one clean task branch per phase (or one combined branch `task/v265-horizon-portal-polish` if executing sequentially), verify all checks, and open a PR into `main` (never push directly to `main`).

---

## 1. Design Research Synthesis (What to Adopt vs. What to Reject)

External references audited on `2026-11-26` and recorded in `references/catalog.json`:

1. **Horizon Design System (ServiceNow — `horizon.servicenow.com`):**
   - **Adopt:** Strict **Portal vs. Workspace** separation, unified top-level navigation mental model (`ImperialSectionHeader`), clear empty/loading/offline/sync status states, and keyboard/WCAG 2.2 AA accessibility discipline.
   - **Reject:** Light corporate enterprise gray/teal surfaces.
2. **Horizon UI (`github.com/horizon-ui`):**
   - **Adopt:** Crisp **3-tier dark surface elevation** (`#0d0914` ground → `#16101fed` smoked card with hairline specular rim → `#20172bf0` raised hover/drawer/modal with colored glow) and **compact Bento KPI summary cards** with tabular numbers.
   - **Reject:** Over-rounded `20px+` crypto-SaaS pills and bright cyan/indigo corporate palettes.
3. **Orizon Design (`orizon.co`):**
   - **Adopt:** High-craft **editorial showcase rhythm** (commanding visual focal point → concise value line → decisive directional `↗` CTA), crisp `150–250ms` micro-interactions, and expressive gradient glow highlights.
   - **Reject:** Giant agency sans-serif headings and decorative `01 / 02 / 03` marketing counters.

### Non-Negotiable TFAM Visual & Engineering Guardrails (Override All Upstream Defaults)
- **Theme:** Imperial Dark Fantasy · Frost & Blood Velvet · Glow-Gradient AAA (`#0d0914`, `#16101fed`, `#20172bf0`, `#f6ebd8`, `#dfc28f`, `#f6dfb1`, crimson `#872641`, amethyst `#c48cff`, frost-sapphire `#7be3ff`).
- **Fonts:** `Cinzel` / `Cormorant Garamond` (display) + `Spectral` (prose) + `system-ui` only for tiny uppercase metadata kickers (`10–12.5px`).
- **Shared Header Component:** Reuse existing `site/app/components/ImperialSectionHeader.tsx` (`imp-hero`, `imp-hero-aura`, `imp-hero-controls`, `imp-hero-bar`) so global rooms match Characters, Atlas, Landmarks, and Military (`v258–v264`) seamlessly.
- **Zero Idle CPU/GPU Waste:** 100% GPU-composited CSS + static SVG gradients/filters. **No** 60fps JS `requestAnimationFrame` particle loops, **no** `MutationObserver` on `document.body`, **no** `next/link` imports (use native `<a href="...">` for Vinext RSC safety).
- **Mobile `390px` Discipline:** `0px` horizontal overflow (`scrollWidth <= innerWidth`), `>= 44×44px` tap targets, visible `:focus-visible` outline (`2px solid #f0d29b`), and `@media (prefers-reduced-motion: reduce)` fallbacks.
- **Data Ownership:** Do **not** alter D1 schemas, `site/lib/story/*.json`, R2 URLs, or `DiscoveryProvider` unlock logic (`en_book*` + `complete: true`).

---

## 2. Shared Glow-Gradient Token Reference (Match `CharacterRadar` v258)

Use these exact CSS variables across Achievements, Chronicles, and Maison Vestigium so every room feels engineered by the same studio:

```css
/* Elevation tiers (Horizon UI 3-tier dark hierarchy adapted to Obsidian Plum) */
--tfam-ground: #0d0914;
--tfam-tier-1: linear-gradient(155deg, rgba(26, 17, 37, 0.90), rgba(14, 10, 23, 0.95));
--tfam-tier-2: linear-gradient(145deg, rgba(38, 22, 48, 0.94), rgba(18, 11, 28, 0.97));
--tfam-rim: rgba(226, 196, 143, 0.22);
--tfam-rim-bright: rgba(246, 214, 154, 0.62);

/* Signature Glow Accents */
--glow-crimson-from: #ff7a88; --glow-crimson-to: #cf274d; --glow-crimson: rgba(255, 92, 118, 0.48);
--glow-arcane-from:  #e3a8ff; --glow-arcane-to:  #8947ff; --glow-arcane:  rgba(186, 116, 255, 0.52);
--glow-gold-from:    #ffe8a3; --glow-gold-to:    #ce8e32; --glow-gold:    rgba(246, 200, 108, 0.48);
--glow-frost-from:   #86e7ff; --glow-frost-to:   #2c87e6; --glow-frost:   rgba(98, 210, 255, 0.46);
--glow-jade-from:    #88f5ce; --glow-jade-to:    #249a79; --glow-jade:    rgba(104, 232, 184, 0.44);
```

---

## 3. Execution Workstreams (3 Bounded Phases)

### Phase 1 — Reading Achievements (`/achievements`) · Horizon Bento KPIs + Glow Milestones
**File Scope:**
- `site/app/components/DiscoveryProgress.tsx` (ONLY inside `AchievementTracker()` — do **not** change `DiscoveryProvider` logic!)
- `site/app/achievements-211.css`
- `site/app/achievements/page.tsx` (only if wrapper class/layout tweak is needed)

**Forbidden:**
- Do **not** touch `DiscoveryProvider` state/fetch/unlock logic, `site/lib/discovery.ts`, `site/lib/discovery-milestones.json`, or `site/tests/discovery.test.mjs`.

**Design Spec:**
1. **Unified Header:** Replace `.ach241-hero` with `<ImperialSectionHeader>` (`kicker="Imperial Codex · Reader Progression"`, `title="Reading Achievements"`, `subtitle="Your reading milestones connect the chronicles directly to the empires and characters beyond them."`, `countValue={d.earned.size}`, `countLabel="achieved"`).
   - Place a glowing crimson-gold primary CTA `<a href="/chronicles">Continue Reading ↗</a>` + a clean sync status pill (`Account Synced` / `Guest · Browser Storage` / `Offline · Local Retained`) inside `rightControls` or `bottomBar`.
2. **3-Card Glowing Bento KPI Row (Horizon UI dark elevation):**
   - Card 1 (**Milestones Achieved** — Imperial Gold medallion icon): `d.earned.size` / `published.length`.
   - Card 2 (**Verified Chapters Read** — Frost Sapphire medallion icon): `d.covered.size` chapters verified.
   - Card 3 (**Account Sync Status** — Arcane Amethyst or Jade medallion icon): clean state label (never claim browser guest progress syncs across devices!).
3. **Glow-Gradient Milestone Cards (`.ach241-bento`):**
   - 2-column desktop (`minmax(320px, 1fr)`), 1-column mobile `<= 640px`.
   - Each card gets a `30×30px` luminous icon medallion (Trophy / Crown / Compass), crisp gradient badge (`Achieved` in glowing gold-jade or `{pct}%`), **`5px` glowing gradient progress bar with bright leading tip-spark** (same visual language as `CharacterRadar`), and bottom metadata row (`X of Y verified chapters` + unlocked realms).
   - Unlocked cards (`is-earned`) get a gilded rim glow + luminous bottom accent beam.
4. **Forthcoming Milestones Drawer (`<details className="achievement211-future">`):**
   - Style as an obsidian smoked panel with smooth border-color hover and readable ivory chips for upcoming volumes.

---

### Phase 2 — The Chronicles (`/chronicles`) · Orizon Editorial Showcase + Arc I Spotlight
**File Scope:**
- `site/app/components/ChroniclesHub.tsx`
- `site/app/chronicles-211.css`

**Forbidden:**
- Do **not** touch `site/lib/story/english-index.json`, `site/lib/story/*.json`, `/api/story`, or `ReadingRoom.tsx`.
- Keep static import of `ChroniclesHub` in `site/app/page.tsx` (never revert to `dynamic(..., { ssr: false })`).

**Design Spec:**
1. **Unified Header:** Replace `.v250-chronicles-hero` with `<ImperialSectionHeader>`:
   - `kicker="Through Frost and Myth · Six-Arc Canon"`
   - `title="The Chronicles"`
   - `subtitle="Six collector volumes tracing the frozen war of 1715–1716."`
   - `countValue={publishedChapters.length}`, `countLabel="published chapters"`
   - `rightControls`: Primary glowing CTA `<a href="/read/en_book1_001">Begin Arc I ↗</a>` (only when `publishedChapters.length > 0`).
2. **Orizon-Style Volume Shelf (`.v250-arcs-grid`):**
   - 3-column desktop (`repeat(3, minmax(0, 1fr))`), 2-column tablet, 1–2 column mobile `390px` (`0px` overflow).
   - Give published volumes (Arc I) a **glowing crimson-gold rim & luminous status pill** (`38 Chapters Available`) and subtle radial aura behind the hardcover book on hover (`180–240ms` compositor-only `transform` + `box-shadow`).
   - Give forthcoming volumes (Arcs II–VI) an intentional dark-velvet archival sheen with quiet `In Preparation` label so availability hierarchy is instant at a glance.
3. **Polished Arc Modal (`dialog.v250-arc-modal`):**
   - 3-tier dark obsidian glass modal with subtle top specular hairline, sticky header, **quick chapter filter input** inside Arc I modal (`Filter 38 chapters by title or number...`) so readers can jump straight to any chapter without endless scrolling, and crisp directional `↗` links on every chapter row (`min-height: 44px`).

---

### Phase 3 — Maison Vestigium (`/vestigium`) · Luxury Storefront Header & Glowing Tiers
**File Scope:**
- `site/app/components/VestigiumCollection.tsx`
- `site/app/vestigium-boutique.css`

**Forbidden:**
- Do **not** alter `site/lib/vestigium.ts`, `site/lib/vestigium-browser.ts`, `site/lib/exhibit-presentation.ts`, `localStorage` key `tfam-vestigium-vault-v1`, hash routing `#vestigium/<cat>/<id>`, or break `site/tests/vestigium-palette.test.mjs` / `site/tests/vestigium-images.test.mjs`.
- Keep `.vest-boutique-bar` / header non-sticky or non-overlapping with `.command-bar` (preserve PR #38 fix!).

**Design Spec:**
1. **Unified Imperial Boutique Header:**
   - Replace the separate `.vest-boutique-bar` strip with `<ImperialSectionHeader>`:
     - `kicker="Maison Vestigium · Cosmic Artifact Archive"`
     - `title={isGuard ? 'Royal Guard Pendants' : categoryName}`
     - `subtitle={isGuard ? 'One hundred numbers revealed through the chronicles.' : 'Traces of impossible worlds — collected, classified, and sealed.'}`
     - `rightControls`: Segmented `Exhibition / Catalogue` pill toggle + glowing `Imperial Vault ({vault.length})` button with gold-crimson accent.
     - `bottomBar`: Horizontal snap-scrollable category tabs (with glowing gradient active underline) + dark-glass search input & abundance `<select>`.
2. **Orizon Specimen Showcase & 3-Tier Exhibit Cards:**
   - Frame the `.vest-collection-intro` 3-specimen stage in a dark obsidian velvet showcase with subtle top-down spotlight aura.
   - Upgrade `.vest-object` cards with 3-tier dark elevation, subtle hover lift (`-4px`), and a **`2px` glowing rarity-tinted bottom beam** (`--vest-color`) matching Character Roster cards.
   - Preserve high-contrast readable pigments in the detail `<dialog>` (`>= 4.5:1`).
3. **Horizon-Grade Slide-Over Vault Drawer (`.vest-vault-drawer`):**
   - Obsidian glass surface with left gilded-glow border, crisp item rows with rarity accent dot, clear empty-state illustration/guidance, and `>= 44px` close/remove touch targets.

---

## 4. Mandatory Verification Checklist (Before Opening PR)

Run inside `site/` on the local machine:

```bash
npx tsc --noEmit
node --test tests/*.test.mjs
pnpm run build
```

Then boot `pnpm run start` and visually verify in Chrome/Playwright at **`1440×900`** and **`390×844`**:
- [ ] `/achievements`: `0` JS errors, `0px` horizontal overflow, Bento KPIs & milestone glow bars aligned, guest/account sync text honest.
- [ ] `/chronicles`: `0` JS errors, `0px` horizontal overflow, `ImperialSectionHeader` renders immediately in SSR, Arc I modal opens & chapter filter works, clicking a chapter opens `/read/en_book1_*`.
- [ ] `/vestigium`: `0` JS errors, `0px` horizontal overflow, no sticky header overlap with `.command-bar`, Exhibition/Catalogue toggle + category switching + `Reserve in Vault` + Vault drawer all work cleanly.
- [ ] Reduced motion (`prefers-reduced-motion: reduce`) disables hover lifts/transitions cleanly.
- [ ] Update `ops/handoff.json` before pushing your `task/*` branch and opening a PR into `main`.
