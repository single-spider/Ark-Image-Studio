# Interaction implementation plan

Source: user-supplied **Ark Image Studio v2: Next Implementation Pass Research** (2026-11-21). This plan intentionally preserves the already approved Nocturne/Obsidian three-column layout.

## Phase 1: motion and canvas
- Shared motion policy: app-level MotionConfig with user-reduced-motion and reusable tokens.
- Image comparison adapted from Motion Primitives: pointer drag, smooth reveal, accessible arrow-key slider, A/B swap.
- Lens adapted from Magic UI: ~2× inspection, hover-following magnifier, wheel-controlled zoom, clipped within existing canvas.
- Dynamic floating toolbar influenced by Motion Primitives: show context-only controls without resizing the workspace.
- Scope: frontend mock; real FastAPI integration remains deferred.

## Phase 2: floating iteration deck
Keep Ark-owned. Add collapsed fan, hover/focus spread, selected lift, horizontal scrub, double-click Keeper, Shift-click comparison, and contextual lineage actions. The deck must remain borderless and overlap the image.

## Phase 3: gallery architecture
Use TanStack Virtual for an efficient multi-lane gallery that can scale to 5,000+ mock images. Retain existing dark card language, filter semantics, and keyboard usability.

## Phase 4: desktop actions
Test a deliberate Motion major upgrade before consuming Animate UI; use Base UI / React Aria accessibility primitives for context menus and comboboxes. Restrictive source licenses must be respected.

## Engineering acceptance
- No change to the three-column proportions, typography, warm mineral accents, or image-first hierarchy.
- Mouse, touch, and keyboard controls work; Escape and arrow keys behave predictably.
- `npm run build` passes on CI.
- System reduced-motion preference disables decorative translation / scale animations.
- No constant heavy WebView2 shaders or high-frequency DOM measurements.
- Backend filesystem and image ID contracts stay untouched.

## Authoritative upstream links
- https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/lens.tsx
- https://github.com/ibelick/motion-primitives/blob/main/components/core/image-comparison.tsx
- https://github.com/ibelick/motion-primitives/blob/main/components/core/toolbar-dynamic.tsx
- https://github.com/ibelick/motion-primitives/blob/main/components/core/animated-background.tsx
- https://animate-ui.com/docs/primitives/base-ui/context-menu
- https://tanstack.com/virtual/latest/docs/framework/react/react-virtual
