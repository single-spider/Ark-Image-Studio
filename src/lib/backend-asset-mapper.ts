/**
 * A deliberately lossy display projection. The authoritative BackendAsset
 * remains available for metadata/curation; do not write the projection back
 * to SQLite or infer original file IDs from the UI.
 */
import type { BackendAsset } from './backend-types';
import type { StudioAsset, AspectRatio } from '../types/studio';
import type { ReadOnlyBackendClient } from './backend-client';

const ratios: Array<[AspectRatio, number]> = [
  ['1:1', 1],
  ['4:3', 4 / 3],
  ['3:2', 3 / 2],
  ['16:9', 16 / 9],
  ['9:16', 9 / 16],
];

function approximateRatio(aspect: number): AspectRatio {
  if (!Number.isFinite(aspect) || aspect <= 0) return '1:1';
  return ratios.reduce((closest, candidate) =>
    Math.abs(candidate[1] - aspect) < Math.abs(closest[1] - aspect) ? candidate : closest,
  )[0];
}

export function backendAssetToStudio(asset: BackendAsset, client: ReadOnlyBackendClient): StudioAsset {
  const seed = typeof asset.metadata.seed === 'number' && Number.isFinite(asset.metadata.seed)
    ? asset.metadata.seed : 0;
  return {
    id: asset.id,
    src: client.assetUrl(asset.image_url),
    thumb: client.assetUrl(asset.thumb_url),
    title: asset.original_name || asset.id,
    prompt: asset.prompt,
    seed,
    model: asset.model || 'Unknown model',
    createdAt: Number.isFinite(asset.timestamp)
      ? new Date(asset.timestamp).toISOString().slice(0, 10)
      : 'Unknown',
    // UI display grouping only; not a backend collection membership.
    collection: asset.vault_category ?? asset.library_category,
    ratio: approximateRatio(asset.aspect_ratio),
    keeper: asset.curation_state === 'keeper' || asset.curation_state === 'final',
  };
}
