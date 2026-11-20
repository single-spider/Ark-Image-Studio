# Ark v2 Library System

**Status:** Phase 3 frontend mock; implementation target for the production asset explorer.

## Product decision

The library has two views over **the same assets and IDs**:

1. **Mini Library**: an optional quick-access tray in the right column of the studio.
2. **Full Library**: an independent, full-window asset-browsing workspace with collections, filters, a virtualized image grid, and an optional metadata inspector.

Both prioritize images. **No permanent title, model, badge row, or spacer appears beneath a thumbnail.** Information appears as a lightweight overlay on image hover or keyboard focus. A discreet information control on the upper-right of every image opens the full inspector.

### Mini Library behavior

- Remains beside the canvas only when requested. Hide using the Mini button in the top toolbar, the panel collapse icon, or keyboard **L** outside text inputs.
- When hidden, the studio becomes a true two-column layout: the image workspace expands; Studio Controls retain a practical fixed width. The setting persists locally in the browser.
- Has a compact search, All/Keepers/Recent presets, optional collection filtering, and 2/3-column density. The masonry has **5 px gutters and zero captions**.
- Single-click selects an image for the canvas; hover reveals only the title and model. The small **i** icon opens Full Library with that image already selected in the inspector.
- Each image supports a discrete more-actions affordance and right-click.
- The bottom **Open Full Library** command switches to the dedicated browser without closing the desktop app.

### Full Library layout

- **Top command bar:** ARK Library identity, scope breadcrumb, import, return to Studio.
- **Left navigation:** quick views (All, Keepers, Recent, Imports, Generations), user collections, model facets. This can become a folder tree when the backend provides authoritative hierarchy metadata.
- **Center:** collection title, universal asset search, sort, density, image-only virtual masonry, status footer.
- **Right inspector, optional:** large preview plus provenance, model, seed, aspect ratio, creation date, collection, Keeper state, prompt text, immutable ID, optional lineage. It also hosts primary actions (Open, Compare, Reference) and secondary actions (Keeper, Remove Preview).

Opening Full Library without a selected image starts in wide image-only browsing mode with the inspector hidden. Clicking a thumbnail opens the inspector. Double-click opens it on the studio canvas and returns to Studio. The information button does the same as selection without opening the canvas.

### Hover hierarchy

- **Always visible:** image, a subtle upper-right `i`, Keeper badge if applicable, a thin selected-frame ring.
- **Hover / keyboard focus:** title and model in a subtle bottom gradient, and a more-actions button.
- **Inspector:** technical metadata, IDs, prompt, and all actions.
- **Absent:** captions below tiles, folder bars inside every image card, persistent thick outlines, multi-row metadata overlays.

This makes browsing by visual composition and atmosphere effortless without sacrificing editability.

## Shared commands

| Gesture | Mini | Full |
|---|---|---|
| Click image | Open image on canvas | Select image and open inspector |
| Double-click image | Same as click | Open canvas and close Full Library |
| Click `i` | Open full inspector for image | Open inspector for image |
| Right-click / More | Context actions | Same context actions |
| Toggle Keeper | Shared asset state | Same shared state |
| Compare / Reference | Shared action wiring | Same shared action wiring |
| Delete | Remove mock preview record | Remove mock preview record with confirmation |

**Shortcuts:** `L` toggles Mini Library, `G` opens Full Library, and `Escape` returns from Full Library to Studio. Input fields keep their normal typing behavior. Right-click menus support arrow-key navigation and Escape.

## Search, sorting and discovery

The frontend mock searches normalized title, prompt, collection, model, seed and asset ID. Sort supports newest, oldest, title and model. The Recent view shows the newest 8 results in Mini Library and newest 36 in Full Library; these limits are presentation defaults.

Production search should delegate to the existing server-side SQLite FTS5/indexed query endpoint, rather than pulling the entire asset database into browser memory. Pagination/cursor search should apply before virtualizing results; sorting and filters should share the same query contract.

## Virtual masonry architecture

`search / filters / sort -> matching asset IDs -> TanStack Virtual lanes -> Ark image-only tiles`

The implementation uses `@tanstack/react-virtual` with multi-lane shortest-column assignment, stable item keys, thumbnail dimensions derived from aspect metadata, ResizeObserver for responsive column count, and only rendered/overscanned tiles in the DOM. It avoids copying React Bits Masonry source because the production use case is a very large indexed archive.

The **5K TEST** toggle produces 5,000 clearly labeled synthetic records using repeated demo imagery. Those records are an in-browser stress test, **not** real assets, and actions resolve to the original mock image. Real backend IDs remain immutable. Test large-library scrolling and filter changes with this mode before integrating SQLite results.

## Future backend connection (requires actual source files)

The existing FastAPI + SQLite + NTFS hardlink project is authoritative for real files, IDs, and folder operations. The UI assumes nothing about undocumented JSON shapes or server routes. The following rules are mandatory during integration:

- Retain `output_*`, `import_*`, `split_*`, and `download_<sha256>` ID generation/lookup behavior defined by the actual backend, once inspected.
- Do not move existing files out of `Downloads/Images/*` or `web/generation_history`.
- Never implement a Gallery “delete” by directly manipulating the user's disk or NTFS hardlinks from React.
- Keep `studio-heartbeat.json` and the external download sorter contract undisturbed.
- Expose library queries, asset metadata, thumbnail URLs, lineage, Keeper/Finals state, and actions through a thin typed adapter in `src/lib/api.ts`.
- Differentiate **collections** (user organization), **system smart views** (Keepers/Finals/Imports/etc.), and **physical storage paths** (managed by backend). A collection selection must not automatically move files.
- On Windows, thumbnail decoding/caching and lazy loading should be optimized for WebView2. For very large libraries, use paginated server data and virtualize only the returned visible results.

## Acceptance checklist

- [ ] Closing Mini Library gives the image canvas more room without disturbing center controls.
- [ ] Mini open/closed preference survives browser reload.
- [ ] Both grids show no reserved caption rows at any viewport size.
- [ ] Hover and keyboard focus reveal title/model, while the `i` button opens detailed metadata.
- [ ] Opening Full Library from Mini preserves the selected asset context.
- [ ] Full Library can search, filter, sort, change density and navigate collections.
- [ ] Full Library inspector shows metadata, prompt and shared asset actions.
- [ ] 5,000 synthetic items remain virtualized; only visible/overscanned tiles exist in DOM.
- [ ] Normal scrolling, keyboard navigation, reduced motion, and right-click menus remain usable.
- [ ] Existing Nocturne studio screenshot composition stays recognizable.
- [ ] Strict TypeScript and Vite production build pass.
- [ ] No backend or user filesystem modifications occur in this phase.

## Deliberate deferrals

1. The authoritative folder tree, file counts, Finals/Archive taxonomy, disk paths, and full metadata model until backend source/schema inspection.
2. Virtualized fetching / server cursors until backend API endpoints are verified.
3. Animate UI context-menu adoption until its Motion-major peer requirements are evaluated.
4. Preview-only upload persistence, tagging, duplicate detection, bulk metadata operations, and actual destructive disk actions.
