# Component research catalog

The detailed component license/feasibility report was provided in chat. This file is a staging index for the next research session; it does not include third-party source code.

| Source | Project license reported in research | Priority examples | Integration policy |
| --- | --- | --- | --- |
| [Magic UI](https://magicui.design/) | MIT | Lens, Animated List, File Tree, Shine Border | Adapt source with notices retained |
| [Motion Primitives](https://motion-primitives.com/) | MIT | Animated Background, Image Comparison, Dynamic/Expandable Toolbar, Dock | Adapt source with notices retained |
| [Animate UI](https://animate-ui.com/) | MIT + Commons Clause (reported) | Context Menu, Popover, Combobox, Auto Height, Scroll Fade | Use inside Ark under terms; prefer underlying primitives for reusable abstractions |
| [React Bits](https://reactbits.dev/) | MIT + Commons Clause (reported) | Masonry, Glass Surface, Swipe Toast, Glide Select, Magic Bento | Verify exact component/tier; avoid redistributing ported components as a standalone library |

## Implementation status

- Initial UI includes **original Ark implementations** of tab selection, gallery, image comparison, magnifier, floating iteration strip, menus, toasts, and contextual toolbar.
- Those are **not represented as verbatim ports** of Magic UI/Motion Primitives/Animate UI/React Bits.
- Before introducing actual third-party component source, record: source URL, commit/version, dependency list, license text/notice, integration path, and reduced-motion behavior.
- Avoid storing a giant vendor-code dump without a concrete use case.

## Research pass, 2026-11-21

See `docs/INTERACTION_IMPLEMENTATION_PLAN.md` for phased work and `THIRD_PARTY_NOTICES.md` for MIT attribution.

Source files checked:
- [Motion Primitives Image Comparison](https://github.com/ibelick/motion-primitives/blob/main/components/core/image-comparison.tsx)
- [Motion Primitives Toolbar Dynamic](https://github.com/ibelick/motion-primitives/blob/main/components/core/toolbar-dynamic.tsx)
- [Magic UI Lens](https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/lens.tsx)
- [TanStack React Virtual](https://tanstack.com/virtual/latest/docs/framework/react/react-virtual)

Animate UI currently requires an independently tested Motion upgrade (research found Motion `^14` peer dependency). It is deferred.
