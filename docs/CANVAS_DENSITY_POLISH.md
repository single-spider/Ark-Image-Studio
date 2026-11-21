# Canvas density and liquid-glass polish

**Decision:** Preserve the approved Nocturne/Bento architecture while reducing interface chrome and giving controls inside the image workspace one coherent material language.

## Screenshot findings (annotated 2026-11-21)

The user highlighted:
- **Red:** unused vertical and horizontal bands above the canvas, especially the duplicated “Creative Workspace / Workspace” headers, “Design Study” banner, and large centered “Interactive Demo” label.
- **Blue:** canvas controls that feel scattered or visually heavy, especially the detached mode badge, Tools toggle, bottom-right Keeper pill, and the distant “Lineage View” label.

## Changes

1. Remove the full-width design-study row and combine the canvas identity with the Workspace heading.
2. Tighten the topbar from 88px to 72px; remove the redundant Interactive Demo banner from that bar while retaining **Mock API / No AI Calls** in the footer.
3. Tighten Workspace heading and tabs; dynamically allocate recovered height to the image viewport. Side panels retain the same overall visual height as Workspace.
4. Consolidate mode, Keeper and Tools into a compact upper-right **liquid-glass dock**. Move Keeper out of the lower-right image area; it stays fully functional as a bookmarked icon with accessible label and pressed state.
5. Remove the detached “Lineage View” label. The iteration header becomes a small frosted capsule; thumbnails remain **borderless as a group**, with subtly reflective individual frames. Only reveal gesture instructions on hover/focus.
6. Use the same glass language for the image ID badge, A/B slider handle/labels, inspection rim, and contextual menu. Maintain the natural image as the hero and keep foreground text high-contrast.

## Performance and accessibility guardrails

- Liquid glass is CSS-only using a small number of **static** backdrop-filter surfaces (no animated blur, shaders or continuous compositing loops).
- Keep blur confined to small floating controls. Do not add a large frosted overlay over the full canvas or iteration strip.
- Use a solid dark fallback if the environment does not support or has disabled transparent surfaces.
- Respect reduced-motion mode for instruction fade and Keeper transitions.
- All buttons retain existing functionality, mouse/touch use and keyboard labels. The mode indicator is informational.

## Visual acceptance tests

- [ ] In two-panel mode, the top canvas starts noticeably closer to the main app topbar.
- [ ] In three-panel mode, Gallery and Studio Controls remain aligned with Workspace.
- [ ] At 1427×1057 and a smaller laptop viewport, image, Studio Controls and footer fit without a gratuitous full-width heading band.
- [ ] Image ID, mode, Tools and Keeper remain readable over bright forest, snow and sunset imagery.
- [ ] Collapsing/expanding Tools, toggling Keeper, comparing images, using Lens, painting Mask, and scrubbing Iterations still work.
- [ ] Iteration images do not acquire a giant frosted enclosing card.
- [ ] Reduced-motion and reduced-transparency settings remain usable.
- [ ] GitHub Pages remains mock-only; backend/library and sorter contracts are unchanged.

Implementation: `src/styles/canvas-polish.css`, `src/components/Workspace.tsx`, `src/components/IterationDeck.tsx`, and `src/App.tsx`.
