# Backend integration boundary

The GitHub Pages frontend remains a fully interactive **mock preview**. GitHub Pages cannot run FastAPI, Windows native APIs, NTFS hardlink logic, or local filesystem scanning.

## Audited source, 2026-11-21

The user supplied a v2 source ZIP containing `backend/app.py`, `backend/db.py`, `backend/jobs.py`, `desktop_v2.py`, `frontend/src/lib/api.ts`, and `frontend/src/types/studio.ts`. Their actual API routes, responses, database fields, event names and desktop launch flow have been reviewed.

See [Backend Contract Audit](BACKEND_CONTRACT_AUDIT.md) for exact verified contracts, missing dependencies, destructive-operation warnings, source-tree differences, and the safe integration sequence.

**Not supplied:** `image_library.py`, `DOWNLOAD_SORTER.md`, and `DESKTOP_APP.md`. Consequently the full filesystem ID rules, download sorter heartbeat, and compatibility/packaging requirements are not yet completely verified.

## Read-only integration foundation

The frontend now has a strictly optional, loopback-only contract client:

- `src/lib/backend-types.ts` defines the verified backend asset, chain, job, bootstrap and query response shapes.
- `src/lib/backend-client.ts` supports **GET** assets/bootstrap/chain and listening to the local WebSocket only.
- `src/lib/backend-asset-mapper.ts` converts backend assets to Ark's display type, preserving immutable asset IDs.

These modules are **not wired into the running app**. They do not connect to the desktop backend automatically or make any mutation. Browser preview data remains synthetic.

## Deployment modes

1. **Public GitHub Pages:** static frontend mock, no real library, no token, no localhost connection.
2. **Local desktop development:** PyWebView2 opens Vite at `localhost:5173` with a short-lived `apiPort` and token supplied by its launcher. The backend binds to `127.0.0.1`.
3. **Packaged desktop:** PyWebView2 opens the built frontend served by its own FastAPI loopback process. Build and copy Ark's new frontend assets to the expected `v2/frontend/dist/` location only after the packaging layout is validated.

The backend's `/api/bootstrap` can expose local config including a provider API key. Keep secrets in the desktop environment and never commit raw config or attach such data to the public website.

## Integration strategy

Map the authoritative backend response into Ark's existing image workspace, Mini Library, Full Library, and iteration deck. Do not copy the uploaded older frontend layout or its unrelated mock API contract.

The existing backend is responsible for image identity, curation, reference import, generation, job updates, Vault/Finals mirrors, and disk operations. React handles display state and user interaction. All filesystem mutations must be deliberate, explicit, and independently tested, especially DELETE and any operation triggering NTFS hardlink synchronization.

The original [Design Direction](DESIGN_DIRECTION.md) remains authoritative for the UI.
