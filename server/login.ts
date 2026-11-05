import type { SupabaseClient } from '@supabase/supabase-js';
import { gatePage, SECURITY_HEADERS } from './gatePage.js';
import { clearCookie, createSessionToken, gateConfigError, passwordMatches, safeNext, sameOrigin, sessionCookie, type GateEnv } from './session.js';

export const MAX_FAILURES = 10;
export const WINDOW_MINUTES = 15;

const memory = new Map<string, number[]>();

function clientIp(req: Request): string {
  return (req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown').trim().slice(0, 64);
}

/** Failed-attempt limiter. Uses the `login_attempts` table when the database is configured. */
async function recentFailures(db: SupabaseClient | null, ip: string): Promise<number> {
  const since = Date.now() - WINDOW_MINUTES * 60_000;
  if (db) {
    const { count, error } = await db.from('login_attempts').select('ip', { count: 'exact', head: true }).eq('ip', ip).gte('at', new Date(since).toISOString());
    if (!error && typeof count === 'number') return count;
  }
  return (memory.get(ip) ?? []).filter((t) => t >= since).length;
}

async function recordFailure(db: SupabaseClient | null, ip: string) {
  const list = (memory.get(ip) ?? []).filter((t) => t >= Date.now() - WINDOW_MINUTES * 60_000);
  list.push(Date.now());
  memory.set(ip, list);
  if (db) await db.from('login_attempts').insert({ ip });
}

async function clearFailures(db: SupabaseClient | null, ip: string) {
  memory.delete(ip);
  if (db) await db.from('login_attempts').delete().eq('ip', ip);
}

const page = (status: number, html: string, extra: Record<string, string> = {}) =>
  new Response(html, { status, headers: { ...SECURITY_HEADERS, 'Content-Type': 'text/html; charset=utf-8', ...extra } });

export async function handleLogin(req: Request, env: GateEnv, db: SupabaseClient | null): Promise<Response> {
  if (req.method !== 'POST') return new Response(null, { status: 303, headers: { ...SECURITY_HEADERS, Location: '/' } });
  const cfg = gateConfigError(env);
  if (cfg) return page(503, gatePage({ configError: cfg }));
  if (!sameOrigin(req)) return page(403, gatePage({ error: 'Request blocked. Open the site address directly and try again.' }));

  let password = '';
  let next = '/';
  try {
    const form = await req.formData();
    password = String(form.get('password') ?? '').slice(0, 256);
    next = safeNext(String(form.get('next') ?? '/'));
  } catch {
    return page(400, gatePage({ error: 'Invalid request.' }));
  }

  const ip = clientIp(req);
  if ((await recentFailures(db, ip)) >= MAX_FAILURES) {
    return page(429, gatePage({ next, error: `Too many attempts. Try again in ${WINDOW_MINUTES} minutes.` }), { 'Retry-After': String(WINDOW_MINUTES * 60) });
  }

  if (!(await passwordMatches(env, password))) {
    await recordFailure(db, ip);
    await new Promise((r) => setTimeout(r, 700));
    return page(401, gatePage({ next, error: 'Incorrect password.' }));
  }

  await clearFailures(db, ip);
  const token = await createSessionToken(env);
  return new Response(null, { status: 303, headers: { ...SECURITY_HEADERS, Location: next, 'Set-Cookie': sessionCookie(req, token, env) } });
}

export function handleLogout(req: Request): Response {
  return new Response(null, { status: 303, headers: { ...SECURITY_HEADERS, Location: '/', 'Set-Cookie': clearCookie(req) } });
}
