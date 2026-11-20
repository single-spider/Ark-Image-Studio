# Phase 2: Ark Iteration Deck

The approved Nocturne screenshot remains the composition baseline. This pass changes the behavior of the existing **borderless strip overlapping the main canvas**.

## Delivered

- Ark-owned `src/components/IterationDeck.tsx`, using Motion with reduced-motion compliance.
- Compact fan at rest, hovering or focusing spreads the thumbnails, selected item lifts with a restrained spring.
- Click selects a lineage frame; horizontal drag scrubs over the six visible cards.
- Double-click toggles Keeper; Shift-click compares an iteration against the main canvas.
- Right-click or Shift+F10 opens actions for Set as Main, Compare, Branch, Send to Reference, Keeper, and Remove from Preview.
- Arrow keys navigate focused cards; Escape closes menus and collapses focus spread.
- Context menus support arrow-key navigation and focus restoration.
- Mock generations retain optional `parentId` and `lineageId` metadata. Existing asset IDs remain unchanged. Browser-generated assets still use the mock API.

## Lineage preview caveats

The mock library uses three demo groups of up to six frames. The chain model is a **frontend approximation** and must be adapted to the authoritative database chain query before connecting the FastAPI backend.

A branch action chooses its source frame and inherits its prompt. Generation then creates a mock child with the selected `parentAssetId` and `lineageId`.

Frame deletion is in-memory only and reparents mock children to the removed frame's parent. It does **not** delete, rename, move, or relink any files on disk.

## Smoke test

1. Refresh the GitHub Pages preview after successful deployment.
2. Hover and focus the iteration strip. Verify fan/spread without surrounding card chrome.
3. Click several frames; verify their sequence remains stable while the main image updates.
4. Drag horizontally; verify the selected frame scrubs across neighboring cards.
5. Double-click an image, then check its Keeper icon and gallery Keeper filter.
6. Shift-click another card; verify the main canvas changes to A/B comparison mode.
7. Right-click or Shift+F10 a thumbnail, navigate menu with arrow keys, then choose Branch. Edit the inherited prompt, simulate generation, and verify a child frame appears in that lineage.
8. Verify escape, keyboard focus and the system reduced-motion preference.

## Deferred

- Full persisted ancestry / generation history from the real backend.
- Accessible context-menu library migration (Animate UI peer dependency requires separate upgrade testing).
- Multi-thousand-image gallery virtualizer, planned for Phase 3.
