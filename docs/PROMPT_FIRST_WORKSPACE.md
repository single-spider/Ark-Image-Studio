# Prompt-first workspace refinement

- Iteration history starts collapsed. The footer's Iterations button displays chain count and opens a compact glass drawer over the lower canvas. No permanent history overlay and no image resize on expansion. All existing fan, scrub, keeper, compare, branch and context menu actions remain.
- Asset title and model/aspect/seed are below the picture in a shared footer. Metadata follows the currently displayed surface.
- Mini Library can be moved left/right using the swap control beside Mini in the topbar. The position and collapsed preference persist separately. Left arrangement is Library / Canvas / Studio Controls; right remains Canvas / Studio Controls / Library.
- Prompt Studio occupies the former Generation Setup slot. The frequently changed aspect ratio remains inline, with a compact model/resolution/seed summary.
- Gear beside Copy Prompt opens a centered native modal settings card (480px max), using the original model/ratio/resolution/seed layout and advanced options. Both ratio selectors control the same state. Edits apply immediately; Done, Escape and backdrop click close. Native modal focus handling and app shortcut guard prevent background actions.
- Reduced control padding and reference/shelf height give the prompt more room; bottom canvas shading is removed.
- Only frontend state and styling are changed. The public site remains mock-only.

QA: test drawer both mouse and keyboard, right-click lineage actions, 2/3-panel modes and side persistence, settings keyboard focus/Escape, matching inline/modal ratio state, prompt generation, and normal/small desktop viewport. No actual backend calls are made.
