# Backend Contract Audit: Uploaded v2 Source

**Audited:** 2026-11-21  
**Input:** user-provided `src(1).zip`. This document records observable source contracts, not inferred design direction.  
**Scope:** `backend/app.py`, `backend/db.py`, `backend/jobs.py`, `desktop_v2.py`, `frontend/src/lib/api.ts`, and `frontend/src/types/studio.ts`.

The Nocturne/Obsidian React frontend remains the active design system. Neither of the two uploaded frontend UI trees is imported as the design authority.

## What the ZIP actually contains

The archive contains two distinct front-end source trees:

- `frontend/src/`: a built Vite/React 19 client and its existing REST/WS client, store, and zones. This is the useful **wire-contract reference**, though its layout is not our target UI.
- `src/`: a different incomplete/prototype source tree, including a large mock `services/studioApi.ts`, a Zustand store and custom types. Its `createHttpStudioApi()` references `/api/gallery`, `/api/split`, `/api/mask/roundtrip`, `/api/paint/derivative`, and `/api/images/:id/curation`, **none of which exist in the uploaded FastAPI app**. Do not use this tree as an API source of truth.

The archive also contains `frontend/node_modules/`, `frontend/dist/`, compiled Python cache, and build artifacts. None should be committed into the public Ark GitHub repo.

## Missing implementation dependencies

- `image_library.py` is **absent**. Both FastAPI and SQLite import its path, ID, heartbeat, and containment functions. Its exact IDs/folder behaviors remain **unverified** until provided.
- `DOWNLOAD_SORTER.md` and `DESKTOP_APP.md` are **absent**. The heartbeat protocol, sorter integration, legacy-location resolution and privacy-cover requirements cannot all be independently checked.
- The ZIP does not include a root Python dependency/lock file or an executable complete `v2/` package layout. The source imports `v2.backend` and resolves the parent application root relative to its `v2/` position; dropping the files into Ark's frontend root would break those imports.
- No real user SQLite database was included, which is appropriate. The audit reads only schemas and code, not existing user data.

## Verified backend routes

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/api/bootstrap` | Config, presets, collections, Vault categories, mod packs, recent queue jobs, sorter health, asset count |
| GET | `/api/assets` | Query/search asset index, with filters and server-side limit |
| POST | `/api/assets/sync` | Reindex disk library |
| GET | `/api/assets/{asset_id}/chain` | Active asset ancestry, recent-child path, children and satellite references |
| PATCH | `/api/assets/{asset_id}` | Change curation/Vault fields **and sync filesystem mirrors** |
| POST | `/api/assets/batch` | Bulk curation/Vault updates **and mirror synchronization** |
| POST | `/api/assets/import` | Decode and write image + thumbnail, index DB, optionally update Vault |
| DELETE | `/api/assets/{asset_id}` | Deletes original file, thumbnail and metadata, reparents lineage |
| POST | `/api/generate` | Queue up to four real/dry-run image jobs |
| POST | `/api/jobs/{job_id}/cancel` | Cancel queued or running job |
| POST | `/api/dry-run` | API provider connectivity probe; not the same as local generation dry-run |
| GET | `/library/{category}/{filename:path}` | Original image bytes |
| GET | `/library-thumbnails/{filename:path}` | Thumbnail bytes |
| GET | `/generation_history/{filename:path}` | Legacy history image |
| WebSocket | `/ws` | Event stream |

The backend sends messages of shape `{ "type": string, "payload": object }`. Observed event types: `library_synced`, `asset_added`, `asset_updated`, `asset_deleted`, `job_update`. The `job_update` payload can be a complete queued record or a partial status update. Do not assume every event has the full job shape.

## GET /api/assets query contract

Parameters: `space`, `search`, `vault_category`, `collection_id`, `aspect`, `model`, `sort`, `limit`.

- `space`: `all`, `keepers`, `finals`, `vault`, `generations`, `others`, `originals`, `archived`.
- `aspect`: `portrait`, `landscape`, `square`; the backend filters by the numeric aspect ratio.
- `sort`: `name`, `oldest`, or default newest.
- Search uses SQLite FTS5 token prefix matching in the database, distinct from Ark's current mock client-side substring search.
- `limit` defaults to **5000**. The result is `{ items: Asset[], count: len(items) }`. This `count` is **not an unbounded total match count**, and there is currently no offset/cursor. Before a true 50,000-image archive, implement proper server-side cursor/page retrieval while retaining the full dataset count separately.

The backend defines `assets`, `assets_fts`, `lineage`, `vault_categories`, `mod_packs`, and `jobs` SQLite tables. It uses WAL, an FTS5 index, and its own threading lock.

## Asset schema: authoritative row_to_dict()

```ts
interface BackendAsset {
  id: string; image_url: string; thumb_url: string;
  library_category: string; asset_type: string;
  width: number; height: number; aspect_ratio: number;
  timestamp: number; // milliseconds
  prompt: string; model: string; model_code: string;
  exact_pixels: string; original_name: string;
  curation_state: "draft" | "keeper" | "final" | "archived";
  vault_category: string | null; vault_tags: string[];
  metadata: Record<string, unknown>;
}
```

The backend's Keeper and Final classification is **one curation_state field**, not the `keeper:boolean` used by Ark's mock. A true Keeper update must eventually use `PATCH /api/assets/{id}`; Finals and Vault state also control mirror files. The display adapter added in this pass is **read-only** and makes no curation update.

The `id` is the backend's immutable asset key, created by the missing `image_library.library_id()` helper. The DB does not store a separate backend `collection` name in each asset row. Collections are JSON records referring to image IDs, while Vault membership is stored on the row. The current UI `collection` string is only a display projection and must not be posted back to the backend.

`image_url` and `thumb_url` are loopback-relative URLs including cache-version query strings. The desktop adapter resolves only URLs belonging to the current loopback backend origin.

## Lineage is richer than the mock

`GET /api/assets/{id}/chain` returns:
```ts
{ root_id: string; active_id: string;
  nodes: Array<{ asset: BackendAsset; children: BackendAsset[];
    child_count: number; satellite_refs: BackendAsset[] }> }
```

The backend walks ancestry, then the most recent child path, with sibling children and up to three satellite references. It uses the **first ref_id as the primary parent** for generated images, and stores additional reference IDs/roles separately. The mock `parentId`/`lineageId` fields are an approximation and must be adapted to this response, without changing existing image IDs.

## Generation request differs from Ark's mock API

Real `POST /api/generate` expects:
```ts
{
  prompt: string; model_name: string; model_code: string;
  px_size: string; base_res?: string; aspect_ratio?: string;
  watermark?: boolean; dry_run?: boolean; batch?: number;
  ref_ids?: string[]; ref_roles?: Record<string,string>;
}
```
The model-to-code and exact pixel-size tables exist in the supplied `frontend/src/types/studio.ts` (`SEEDREAM_MODELS`, including multiple 4.x and 5.x models). Ark's current model selector and mock `negativePrompt`, `creativity` and `seed` controls **cannot simply be forwarded** as though they were supported. The real endpoint does not declare those three fields.

The job worker creates `output_...` image files and thumbnails, writes JSON metadata, updates `image_tree.json`, indexes SQLite, and publishes events. Even `dry_run:true` creates a test image and writes it to disk; treat this as a **mutating operation**.

Reference slots in Ark currently accept temporary local browser object URLs. The real queue requires persistent **backend asset IDs** in `ref_ids`. Those local files must first be imported using a reviewed, validated import route, and only with explicit user intent.

## Windows process / security model

`desktop_v2.py` runs FastAPI on a dynamically selected `127.0.0.1` port. It creates a random `ARK_V2_TOKEN` and opens PyWebView2 using `edgechromium`. Dev mode navigates to `http://localhost:5173/?apiPort=<port>&token=<token>`; production navigates to `http://127.0.0.1:<port>/?session=<token>&token=<token>`.

FastAPI accepts the token via `x-ark-token`, session cookie or query parameter for `/api/`. Its WebSocket checks query-token or cookie. The backend CORS allowlist includes only localhost development at port 5173. **GitHub Pages HTTPS cannot directly operate this loopback backend.** Keep Pages a mock visual preview; serve the real built React frontend from FastAPI inside WebView2 in production.

Important: `GET /api/bootstrap` includes the entire persisted `config` object, which may contain the provider API key. Never log, store, commit or display raw bootstrap config in the public frontend or preview. Do not deploy the session token in GitHub Pages settings or connect the static site to a user's live loopback backend.

The existing desktop has `save_image_as(asset_id)` and `open_library_folder()` native bridge methods. The uploaded older frontend also implements privacy-cover behavior on blur and Ctrl+Shift+L; that feature should be maintained when building the production desktop.

## Disk safety and unresolved risk

- `db.sync_asset_mirrors()` synchronizes **Reference Vault** and **Finals** using NTFS hardlink or copy fallback. Curation/ Vault API mutations can create/remove filesystem paths.
- `DELETE /api/assets/{id}` removes the indexed original file and thumbnail, not just the database row. The current mock UI delete actions **must not be wired to this endpoint without explicit destructive-action UX and a rollback strategy**.
- `POST /api/assets/import` writes bytes to a filename with `.jpg` and indexes it. Its MIME validation/transcoding should be audited before importing arbitrary reference files.
- The watcher and startup database scan can perform indexing and thumbnail writes even without a user button being pressed. We have **not started** the uploaded backend, run the watcher, or touched any real image library during this audit.

## Implementation in this branch

Added:
- `src/lib/backend-types.ts`: exact read-only asset/chain/job/query response shapes.
- `src/lib/backend-client.ts`: optional GET/WS client that only accepts loopback origins and exposes no write endpoints.
- `src/lib/backend-asset-mapper.ts`: lossy asset projection into Ark's existing UI type, retaining asset IDs unchanged.

These modules are **not auto-invoked**. They preserve the current GitHub Pages preview and lay the groundwork for the desktop client wiring after the missing dependencies are reviewed.

## Safe next implementation order

1. Add the missing `image_library.py`, `DOWNLOAD_SORTER.md`, and `DESKTOP_APP.md` as review inputs, or link their exact copies, to validate IDs, directory layout and background sorter.
2. Establish an installable backend package layout with a pinned Python requirements file and a non-mutating test configuration.
3. Add an explicit desktop-only backend mode. Initially load `GET /api/assets` and `/api/assets/{id}/chain` into the library and floating iteration deck. Keep mutations disabled.
4. Add WS job/listener state with safe reconnection and cancel handling.
5. After endpoint-specific validation and backup/rollback design, connect Keeper, Vault/Finals, reference import, generation and finally destructive disk operations.

The existing Nocturne frontend remains the visual authority throughout.
