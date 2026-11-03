---
name: Through Frost and Myth Atlas
description: An imperial fantasy world explored through authored art and readable chronicles.
colors:
  ground: "#111018"
  surface: "#1c1722"
  raised: "#2a202d"
  ivory: "#f2eadc"
  muted: "#c6beca"
  crimson-light: "#e591a4"
  aged-metal: "#bba276"
  frame: "#574553"
  field: "#211b27"
  field-stroke: "#766271"
  atlas-control: "#271e2d"
  selected-region: "#553248"
  selected-filter: "#42293d"
  selected-filter-text: "#fff0d8"
  nav-selected: "#ffe8ba"
  moor-ground: "#0c1719"
  moor-surface: "#142326"
  moor-raised: "#213236"
  moor-ivory: "#f0e9dc"
  moor-accent: "#9bd3bc"
  moor-metal: "#c3ad79"
typography:
  display:
    fontFamily: "'Libre Caslon Text', 'EB Garamond', Georgia, serif"
    fontSize: "clamp(46px,5.5vw,92px)"
    lineHeight: 1.04
    letterSpacing: "-.025em"
  headline:
    fontFamily: "'Libre Caslon Text', 'EB Garamond', Georgia, serif"
    fontSize: "clamp(32px,3.5vw,54px)"
    lineHeight: 1.1
    letterSpacing: "-.02em"
  title:
    fontFamily: "'Libre Caslon Text', 'EB Garamond', Georgia, serif"
    fontSize: "27px"
    lineHeight: 1.2
  body:
    fontFamily: "'Libre Caslon Text', 'EB Garamond', Georgia, serif"
    fontSize: "19px"
    lineHeight: 1.75
  label:
    fontFamily: "'Libre Caslon Text', 'EB Garamond', Georgia, serif"
    fontSize: "16px"
  vietnamese:
    fontFamily: "'EB Garamond', Georgia, serif"
rounded:
  square: "0"
  control: "4px"
spacing:
  gutter: "clamp(20px,3vw,64px)"
  compact: "12px"
  control: "16px"
  collection: "24px"
  panel: "32px"
  section: "72px"
components:
  button-atlas:
    backgroundColor: "{colors.atlas-control}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.square}"
    padding: "10px 0"
  field-search:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  faction-navigation:
    textColor: "{colors.muted}"
    rounded: "{rounded.square}"
    padding: "10px 0"
  filter-chip:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    padding: "12px 16px"
  filter-chip-selected:
    backgroundColor: "{colors.selected-filter}"
    textColor: "{colors.selected-filter-text}"
    padding: "12px 16px"
  editorial-card:
    backgroundColor: "transparent"
    textColor: "{colors.ivory}"
    rounded: "{rounded.square}"
    padding: "0"
  dossier:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ivory}"
    width: "min(1440px,96vw)"
---

# Design System: Through Frost and Myth Atlas

## Overview

**Creative North Star: "The Imperial Doorway"**

The actual artwork opens an imperial fantasy world. Ink, wine-purple, crimson light, ivory and aged metal give the interior a nocturnal, ceremonial character. Large subject-specific images and book typography carry the atmosphere; controls stay recognizable and prose stays stable.

The system alternates expansive artwork with compact working collections and legible dossiers. Depth comes chiefly from dark tonal planes, restrained frames and image composition. This is a companion to an authored historical fantasy, so visual emphasis follows real artwork and verified records.

**Key Characteristics:**
- Artwork leads; controls remain immediately available.
- Local book faces support both English and Vietnamese.
- Tonal planes and aged-metal frames organize the dark interior.
- Choreographed image motion ends at stable, readable content.

This is a scan of Update211 source, not a performance certification. Source authority is `site/app/world-211.css`, `archives-211.css`, `chronicles-211.css`, `typography.css` and `site/lib/faction-theme.ts`. The opening scene and reader-selected themes retain their own scoped materials. Surface-specific composition remains in the design contract.

## Colors

The primary accent is a luminous crimson on wine-black surfaces, with aged metal marking selected navigation and frames.

### Primary
- **Crimson Light**: the implemented Castilian accent, bound to `--world-accent`; use for interaction detail rather than large text backgrounds.
- **Aged Metal**: selection rules, focus outlines and significant frames.

### Secondary
- **Moor Green and Bronze**: Moor changes the ground, surface, raised plane, ivory, accent and metal as one palette. Use `royalThemeVariables` through the existing theme owner rather than copying the older light-court palette.

### Neutral
- **Ink Ground / Wine Surface / Raised Wine**: page, dossier and elevated group planes.
- **Ivory / Muted Lavender**: primary reading and secondary metadata respectively.
- **Wine Frame / Field Stroke**: group boundaries and readable field outlines.
- **Selected Filter / Selected Region**: local filled selection states; they are not global accent replacements.

**The One Theme Owner Rule.** Reuse the existing world and royal role variables so faction changes also reach portals and global destinations.

## Typography

**Display and body:** English uses locally loaded Libre Caslon Text with EB Garamond and Georgia fallbacks. Vietnamese uses locally loaded EB Garamond with Georgia fallback. Heading and body roles share these language-aware book faces; there is no new font network dependency.

Display ranges from the arrival scale in the frontmatter to the library's larger title. Headlines organize collections; medium titles identify records; body copy uses generous leading. Lore uses a readable measure up to (70ch), with dossier prose at (19px) and (1.75) leading. Secondary labels remain normal readable text rather than pervasive tiny uppercase ornament.

**The Language Face Rule.** Resolve typography through `--type-heading` and `--type-body`; keep Vietnamese diacritics visible and preserve the loaded font weights.

Reader size, leading, paragraph gap, page width and chosen face remain user preferences. Do not force the archive body token onto the reader.

## Layout

The interior is centered with a maximum width of (1920px) and a fluid gutter from (20px) to (64px). Reused gaps cluster around (12px), (16px), (24px) and (32px), with larger section space for editorial content. Preserve a dense roster beside an expansive principal panel rather than giving every item equal visual weight.

The character workspace starts with a (280px) roster; wide screens expand it to (310px). Below (1100px), portrait and dossier reorganize; below (900px), roster access becomes a drawer and the command bar uses two compact rows. The (767px) mobile rules stack primary panels and keep destination navigation horizontally scrollable. Archive collections and library shelves have their own observed (1050px) transition. These are component breakpoints, not universal device classes.

Portraits and landscapes use subject-appropriate frames. Dossier art uses containment when the full object must remain visible. Native document scrolling stays native. Keep artwork dimensions reserved and use explicit pending-art treatment.

## Elevation & Depth

Flat editorial collections meet darker framed workspaces; routine cards have no box shadow. Overlays use a substantial ambient shadow, while the physical book-cover treatment uses perspective and a directional shadow. The arrival uses gradients to protect identity against its scene.

**The Framed Group Rule.** Borders describe a working group, field or significant frame; do not put a white plaque beneath every label.

The source carries overlay shadow (0 24px 100px #000a), book shadow (16px 22px 40px #0008) and preferences shadow (0 18px 50px #0004). These remain distinct purposes rather than a generic elevation ladder.

## Shapes

The dominant form is rectangular and architectural: square editorial groups, unboxed artwork and fine frame lines. Inputs and Atlas controls use a modest (4px) corner. The book's asymmetric cover corners belong to that object and should not become a global card radius.

Focus is visible as an aged-metal outline (2px) offset by (5px) in the interior. Active destination selection uses a bottom rule rather than a pill. Preserve recognizable native controls and hit areas around (44px).

## Components

### Buttons
Atlas actions are compact filled dark controls with a fine frame and modest corners. Ghost and text actions have no filled plaque. Shared interior interaction changes color/background/border over (180ms), with press transform over (140ms). Keep visible keyboard focus; use the existing semantic active state.

### Inputs / Fields
Dark wine fields use ivory text, a clear field stroke and (4px) corners. Search uses generous horizontal padding. Placeholder text is secondary but readable; a field remains distinguishable from the surrounding surface.

### Navigation
The global destinations use a quiet horizontal book-type row. Faction destinations use normal text, with aged-metal bottom rules and warm ivory for selection. Mobile keeps these destinations reachable through native horizontal overflow. Utility actions occupy their own compact row.

### Chips
Military filters are rectangular outlined controls; selection fills the wine plane and changes both text and frame. Preserve visible category names and counts. They express filtering rather than decorative tags.

### Cards / Containers
Image-led archive cards are flat, with identity below the art and a fine lower divider. Naval and artillery art use landscape framing; people use portrait framing. A pending portrait is labeled pending instead of borrowing a flag. Sidecar previews show the genuine caption structure without inventing substitute artwork.

### Dossiers and image transitions
Dossiers pair art with readable copy on the surface plane; modal frames use aged metal. Carried artwork uses the implemented view-transition timing (440ms) and world easing. Arrival source currently settles the image over (1050ms), or (280ms) on repeat, and the flag over (850ms), or (220ms) on repeat. These observed values differ from the earlier directional contract.

**The Stable Prose Rule.** Animate the image and transition state; keep the reading text out of atmospheric motion.

Reduced-motion selectors and the user motion preference provide static fallbacks. The source includes (140ms) press, (180ms) shared hover, and (420ms) panel vocabulary; these are implementation values, not measured frame-rate promises.

## Do's and Don'ts

### Do:
- **Do** use actual subject artwork at a useful scale and preserve its focal subject.
- **Do** resolve faction material through the existing theme owner and role variables.
- **Do** use local language-aware typography and preserve reader preferences.
- **Do** show selected, loading, pending-art and keyboard-focus states clearly.
- **Do** keep text stable and honor reduced motion and the user's motion setting.

### Don't:
- **Don't** invent artwork layers, full 3D rotation, canon or record attributes.
- **Don't** place white plaques beneath every label or blanket shadows beneath archive cards.
- **Don't** replace missing portraits with flags.
- **Don't** add a font network dependency or another animation framework.
- **Don't** treat source motion timings as evidence of physical mobile performance.

