import { gatePage, SECURITY_HEADERS } from './gatePage.js';
import { gateConfigError, isAuthenticated, safeNext, type GateEnv } from './session.js';

/** Paths that must be reachable before sign-in. Everything else requires a valid session. */
const PUBLIC_PATHS = new Set(['/api/login']);

/**
 * Decide whether a request may continue. Returns `null` to continue, or the Response to send
 * (password screen for pages, 401 JSON for API calls, 503 if the gate is not configured).
 */
export async function gateRequest(req: Request, env: GateEnv): Promise<Response | null> {
  const url = new URL(req.url);
  if (PUBLIC_PATHS.has(url.pathname)) return null;
  const cfg = gateConfigError(env);
  if (!cfg && (await isAuthenticated(req, env))) return null;
  const isApi = url.pathname.startsWith('/api/');
  if (isApi) {
    return new Response(JSON.stringify({ error: cfg ? 'not_configured' : 'unauthorized' }), {
      status: cfg ? 503 : 401,
      headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json' },
    });
  }
  const accept = req.headers.get('accept') ?? '';
  const wantsPage = req.method === 'GET' && (accept.includes('text/html') || accept === '' || accept === '*/*');
  if (!wantsPage) return new Response('Unauthorized', { status: 401, headers: { ...SECURITY_HEADERS, 'Content-Type': 'text/plain' } });
  return new Response(gatePage({ next: safeNext(url.pathname + url.search), configError: cfg ?? undefined }), {
    status: cfg ? 503 : 401,
    headers: { ...SECURITY_HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
  });
}
