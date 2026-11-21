/**
 * Optional, strictly local and read-only FastAPI adapter.
 *
 * This is not enabled automatically in the GitHub Pages preview.
 * No mutate/import/delete/generate endpoints are exposed here.
 * The launched desktop provides apiPort+token for dev or an authenticated
 * same-origin loopback URL when serving the built frontend from FastAPI.
 */
import type {
  BackendAssetChain,
  BackendAssetList,
  BackendAssetQuery,
  BackendBootstrap,
  BackendSocketEvent,
} from './backend-types';

export interface LocalBackendConnection {
  baseUrl: string;
  token: string;
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function detectLocalBackend(location = window.location): LocalBackendConnection | null {
  if (!LOOPBACK_HOSTS.has(location.hostname.toLowerCase())) return null;
  if (location.protocol !== 'http:') return null;

  const query = new URLSearchParams(location.search);
  const apiPort = query.get('apiPort');
  const token = query.get('token') ?? '';

  if (apiPort !== null) {
    const port = Number(apiPort);
    if (!/^\d+$/.test(apiPort) || !Number.isInteger(port) || port < 1 || port > 65535 || !token) return null;
    return { baseUrl: `http://127.0.0.1:${port}`, token };
  }

  // Vite alone on its usual dev port is never interpreted as the FastAPI server.
  if (location.port === '5173') return null;
  return { baseUrl: location.origin, token };
}

export function createReadOnlyBackend(connection: LocalBackendConnection) {
  const baseUrl = new URL(connection.baseUrl);
  if (!LOOPBACK_HOSTS.has(baseUrl.hostname.toLowerCase()) || baseUrl.protocol !== 'http:') {
    throw new Error('Ark backend connections are restricted to local loopback HTTP.');
  }

  async function get<T>(route: string, signal?: AbortSignal): Promise<T> {
    const headers = new Headers({ Accept: 'application/json' });
    if (connection.token) headers.set('x-ark-token', connection.token);
    const result = await fetch(new URL(route, baseUrl), {
      method: 'GET',
      headers,
      credentials: 'include',
      signal,
    });
    if (!result.ok) {
      throw new Error(`Local Ark backend request failed (HTTP ${result.status}).`);
    }
    return result.json() as Promise<T>;
  }

  function assetUrl(relativeUrl: string): string {
    if (!relativeUrl) return '';
    const url = new URL(relativeUrl, baseUrl);
    if (url.origin !== baseUrl.origin || !['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Unexpected off-origin asset URL from local backend.');
    }
    return url.href;
  }

  return {
    connection: { baseUrl: baseUrl.origin },
    assetUrl,
    bootstrap: (signal?: AbortSignal) => get<BackendBootstrap>('/api/bootstrap', signal),
    listAssets: (query: BackendAssetQuery = {}, signal?: AbortSignal) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== '') params.set(key, String(value));
      }
      return get<BackendAssetList>(`/api/assets?${params.toString()}`, signal);
    },
    getChain: (assetId: string, signal?: AbortSignal) =>
      get<BackendAssetChain>(`/api/assets/${encodeURIComponent(assetId)}/chain`, signal),
    connectEvents: (onEvent: (event: BackendSocketEvent) => void) => {
      const url = new URL('/ws', baseUrl);
      url.protocol = 'ws:';
      if (connection.token) url.searchParams.set('token', connection.token);
      const socket = new WebSocket(url);
      socket.onmessage = (msg) => {
        try {
          const event = JSON.parse(String(msg.data)) as BackendSocketEvent;
          if (event && typeof event.type === 'string' && typeof event.payload === 'object' && event.payload) onEvent(event);
        } catch {
          // Ignore malformed events from the WebSocket.
        }
      };
      return () => socket.close();
    },
  };
}

export type ReadOnlyBackendClient = ReturnType<typeof createReadOnlyBackend>;
