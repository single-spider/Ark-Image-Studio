# Material themes and generation activity

## Design

The original Nocturne forest/glass shell remains the default. Existing accent-only presets have become independent material systems:

- Nocturne: forest photography, charcoal-green translucent panels, champagne, serif display type.
- Mineral: cool steel-blue solid panels, brighter slate base, crisp geometry, sans-serif headings.
- Ember: espresso and mahogany surfaces, warm copper ambient glow, serif titles.
- Graphite: neutral carbon, matte compact panels, monochrome silver controls, sans-serif headings.

Themes share geometry, interaction semantics, and asset data. The base surface, panel gradients, input surfaces, menu/inspector/library backgrounds, glass, shadows, accent, and typography are separate CSS tokens. Theme selection persists in local browser storage; root theme attributes support portaled menus. No theme-specific image filters are introduced.

## Generation matrix

Earlier component research identified Magic UI Flickering Grid and Glyph Matrix as potential loading atmosphere. The implementation here is an original Ark CSS dot wave inspired by that idea, not a copy of either upstream component. It renders 105 dots only during the mock generation; CSS animates opacity and scale and respects reduced motion. The current image remains underneath a compact glass activity card, with the submitted model name and explicit simulated-preview label. There is no fabricated progress percentage. The mock delay is 2.8 seconds to allow browser visual review, and no API request is made.

The eventual desktop integration should mount this indicator on real queued/running job states and remove it on success, failure or cancellation. The current UI still uses only the mock API.

## Acceptance checks

- Switch every theme in both studio and Full Library; compare backgrounds, card material, controls, modal and menus, not just accent colors.
- Refresh and confirm the chosen theme persists.
- Generate a mock image and verify the dot matrix is shown only while active, then disappears as the new iteration arrives.
- Test reduced motion and reduced transparency.
- Test text contrast and both Mini Library placements at desktop viewport widths.
- Typecheck and Vite build in CI; visual browser/WebView2 QA remains manual.
