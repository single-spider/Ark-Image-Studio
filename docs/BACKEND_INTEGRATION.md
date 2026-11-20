# Backend integration boundary

The GitHub Pages frontend runs in **mock mode**. GitHub Pages cannot run FastAPI, native Windows APIs, local NTFS hardlink logic, or filesystem scanning.

## Verified from conversation, not from source

The user described an existing Windows/Python backend with:
- FastAPI REST endpoints and WebSocket `/ws`
- SQLite WAL + FTS5 search
- Seedream batch job queue and event names `job_update`, `asset_added`
- Local asset IDs prefixed `output_`, `import_`, `split_`, `download_<sha256>`
- `Downloads/Images/*` and `web/generation_history` filesystem conventions
- `studio-heartbeat.json` sorter protocol
- PyWebView2 native file bridge and privacy-cover shortcut

**These claims are not validated until the actual source files are uploaded and reviewed.** Do not infer request/response types or write migrations from this list.

## Next integration step

Upload only the authoritative backend source and API types:
- `v2/backend/app.py`
- `v2/backend/db.py`
- `v2/backend/jobs.py`
- `v2/desktop_v2.py`
- `v2/frontend/src/types/studio.ts`
- `v2/frontend/src/lib/api.ts`

For a backend rewrite, additionally supply `image_library.py`, `DOWNLOAD_SORTER.md`, and `DESKTOP_APP.md`.

The visual spec can be supplied for **functional requirements and zone boundaries**, while rejected aesthetic directions must not override `docs/DESIGN_DIRECTION.md`.

## Architecture rule

Use a replaceable API adapter in `src/lib/api.ts` and stable domain types in `src/types/studio.ts`. Avoid backend-specific logic in React components. Never mutate or relocate the user's local image library as part of UI setup. Never put secrets or local library images in this public repo.
