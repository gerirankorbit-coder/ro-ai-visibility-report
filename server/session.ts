/**
 * Password gate: signed session cookies (HMAC-SHA256, Web Crypto).
 * Runs unchanged in Vercel Edge Middleware, Vercel Node functions and the Vite dev server.
 */

export interface GateEnv {
  /** The site password (SITE_PASSWORD). At least 12 characters. */
  password: string;
  /** Random signing secret (SESSION_SECRET). At least 32 characters. */
  secret: string;
  /** Session lifetime in hours (SESSION_HOURS, default 12). */
  hours: number;
}

export const MIN_PASSWORD = 12;
export const MIN_SECRET = 32;

type EnvLike = Record<string, string | undefined>;

export function readGateEnv(env: EnvLike): GateEnv {
  const hours = Number(env.SESSION_HOURS ?? '12');
  return {
    password: env.SITE_PASSWORD ?? '',
    secret: env.SESSION_SECRET ?? '',
    hours: Number.isFinite(hours) && hours > 0 && hours <= 24 * 30 ? hours : 12,
  };
}

/** Non-null when the gate cannot run safely. The site then stays closed (fail closed). */
export function gateConfigError(env: GateEnv): string | null {
  if (env.password.length < MIN_PASSWORD) return `SITE_PASSWORD must be set and at least ${MIN_PASSWORD} characters.`;
  if (env.secret.length < MIN_SECRET) return `SESSION_SECRET must be set and at least ${MIN_SECRET} characters.`;
  return null;
}

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer): string {
  let s = '';
  new Uint8Array(bytes).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Key derives from secret AND password, so changing the password signs everyone out. */
async function key(env: GateEnv): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(`${env.secret}\u0000${env.password}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function sign(env: GateEnv, data: string): Promise<string> {
  return b64url(await crypto.subtle.sign('HMAC', await key(env), enc.encode(data)));
}

/** Constant-time string comparison (compares HMACs of both inputs). */
async function safeEqual(env: GateEnv, a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([sign(env, `cmp|${a}`), sign(env, `cmp|${b}`)]);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return d === 0;
}

export async function passwordMatches(env: GateEnv, input: string): Promise<boolean> {
  if (gateConfigError(env)) return false;
  return safeEqual(env, input, env.password);
}

export async function createSessionToken(env: GateEnv, now = Date.now()): Promise<string> {
  const exp = Math.floor(now / 1000) + Math.round(env.hours * 3600);
  return `${exp}.${await sign(env, `v1|${exp}`)}`;
}

export async function verifySessionToken(env: GateEnv, token: string | null | undefined, now = Date.now()): Promise<boolean> {
  if (!token || gateConfigError(env)) return false;
  const m = /^(\d{9,12})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!m) return false;
  const exp = Number(m[1]);
  if (exp * 1000 <= now) return false;
  return safeEqual(env, m[2]!, await sign(env, `v1|${exp}`));
}

/** `__Host-` prefix on HTTPS (forces Secure, Path=/, no Domain). Plain name on http://localhost. */
export function cookieName(req: Request): string {
  return new URL(req.url).protocol === 'https:' ? '__Host-ro_session' : 'ro_session';
}

export function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get('cookie') ?? '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export async function isAuthenticated(req: Request, env: GateEnv): Promise<boolean> {
  return verifySessionToken(env, readCookie(req, cookieName(req)));
}

export function sessionCookie(req: Request, token: string, env: GateEnv): string {
  const secure = new URL(req.url).protocol === 'https:';
  return `${cookieName(req)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.round(env.hours * 3600)}${secure ? '; Secure' : ''}`;
}

export function clearCookie(req: Request): string {
  const secure = new URL(req.url).protocol === 'https:';
  return `${cookieName(req)}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}

/** Only same-site relative paths ("/x"), never "//host" or "/\host". */
export function safeNext(n: string | null | undefined): string {
  if (!n || !n.startsWith('/') || n.startsWith('//') || n.startsWith('/\\') || n.startsWith('/api/')) return '/';
  return n.slice(0, 512);
}

/** Same-origin check for state-changing requests (CSRF defence on top of SameSite=Lax). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return req.headers.get('sec-fetch-site') === 'same-origin';
  return origin === new URL(req.url).origin;
}
