# Ark Studio v2: independent design direction

## North star

**Obsidian Pro Bento / Nocturne**: an image-first creative workstation, with atmospheric photography, deep shadow, warm mineral highlights, fine translucent glass, confident typography, and restrained physical motion. This document governs the new frontend independently of legacy UI directions.

## Locked shell

- **Left, largest**: main image workspace, tabs (Main / Reference / Extra), borderless floating iteration thumbnails overlapping the image near its lower edge, compact floating contextual tools.
- **Middle**: three reference image slots, utility shelf, model/aspect/resolution controls, prompt composer and generation controls.
- **Right**: Mini Gallery Explorer, searchable asset grid, favorites/keepers, contextual asset actions.
- Keep the image as the hero; avoid nested bordered cards, navy-slate surfaces, purple accents, thick separators, and excessive whitespace.

## Motion grammar

- Hover: 120–180ms, low amplitude.
- Panel and menu: 180–260ms, opacity + transform.
- Selection: shared spring or sliding highlight, 240–360ms.
- Generation status: one focused animated signal; avoid multiple competing ambient animations.
- Respect prefers-reduced-motion.
- No constantly active full-screen shader or multiple particle engines in the workstation.

## Colors

- Nocturne: champagne / antique gold.
- Mineral: pale blue / cool mineral.
- Ember: copper / peach.
- Base: charcoal / near-black with atmospheric green undertones.

## UX guardrails

- Visible controls must perform an action, be disabled with an explanation, or be marked as preview-only.
- Keep original image IDs and backend contracts intact when integrating real services.
- Mock image generation must be explicitly labeled as simulation.
- Use keyboard shortcuts, focus outlines, and semantic control labels.
- Do not import old rejected UI concept files as visual authority.

## Source of truth

The user-supplied Sketch 2 and current approved decisions take priority once those files are uploaded. This reconstruction uses the three-column wireframe and previous Nocturne conversation description; it is not a pixel-perfect copy of an unavailable original HTML file.
