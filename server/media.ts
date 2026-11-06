import type { SupabaseClient } from '@supabase/supabase-js';
import { SECURITY_HEADERS } from './gatePage.js';
import { isAuthenticated, type GateEnv } from './session.js';

const MEDIA_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/;
const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };

/** GET /api/media?path=<client>/<file> — streams a private report screenshot to a signed-in session. */
export async function handleMedia(req: Request, env: GateEnv, db: SupabaseClient | null): Promise<Response> {
  if (!(await isAuthenticated(req, env))) return new Response('Unauthorized', { status: 401, headers: SECURITY_HEADERS });
  const path = new URL(req.url).searchParams.get('path') ?? '';
  if (!MEDIA_PATH.test(path)) return new Response('Bad request', { status: 400, headers: SECURITY_HEADERS });
  if (!db) return new Response('Database not configured', { status: 503, headers: SECURITY_HEADERS });
  const { data, error } = await db.storage.from('report-media').download(path);
  if (error || !data) return new Response('Not found', { status: 404, headers: SECURITY_HEADERS });
  return new Response(await data.arrayBuffer(), {
    status: 200,
    headers: {
      ...SECURITY_HEADERS,
      'Content-Type': TYPES[path.split('.').pop() ?? ''] ?? 'application/octet-stream',
      // Files are immutable (random names), so the browser may keep them privately.
      'Cache-Control': 'private, max-age=86400, immutable',
    },
  });
}
