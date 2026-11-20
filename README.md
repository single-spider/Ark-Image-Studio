# ARK Image Studio v2

An atmospheric, three-column desktop AI image studio. This repository is the canonical home for the React UI, the live GitHub Pages preview, design decisions, and future integration with the existing Windows/FastAPI backend.

**Preview:** https://single-spider.github.io/Ark-Image-Studio/ (after enabling GitHub Pages with **GitHub Actions** as its source)

## Status

The initial UI is a **functional frontend mock**, reconstructed from the previously discussed *Nocturne* concept and Sketch 2 three-column layout. It is not a byte-for-byte conversion of the earlier standalone HTML file, which has not been supplied to this repository.

- React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Lucide
- Left: image canvas, compare/inspect/mask tools, floating iteration strip
- Middle: references, model controls, prompt studio
- Right: searchable gallery and asset actions
- Theme presets: Nocturne, Mineral, Ember
- Mock generation only; no paid image API calls
- GitHub Pages deployment on pushes to `main`

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Publishing

1. In **Settings → Pages**, select **GitHub Actions** as the build/deployment source.
2. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes `dist/`.
3. Open https://single-spider.github.io/Ark-Image-Studio/.

If the Pages site initially returns 404, wait for the first workflow to finish and check the Pages source setting.

## Architecture and guardrails

See [Design Direction](docs/DESIGN_DIRECTION.md), [Backend Integration](docs/BACKEND_INTEGRATION.md), and [Component Catalog](research/COMPONENT_CATALOG.md).

The existing backend, disk library, IDs, sorter heartbeat, and NTFS hardlink behavior are **out of scope for the browser mock** until their real source files are inspected. Never commit credentials, local personal assets, generated image archives, or API tokens. GitHub Pages is static hosting, not a Python/FastAPI host.

## Source licensing

The project does not yet declare an overall redistribution license. Third-party libraries retain their own licenses; see the component catalog. Do not paste Commons-Clause-restricted components into a reusable public component library without checking the terms.
