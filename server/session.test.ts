import { describe, expect, it } from 'vitest';
import { gateRequest } from './gate';
import { createSessionToken, gateConfigError, passwordMatches, readGateEnv, safeNext, verifySessionToken } from './session';
import { handleLogin } from './login';

const env = readGateEnv({ SITE_PASSWORD: 'correct horse battery', SESSION_SECRET: 'x'.repeat(40) });
const req = (path: string, init: RequestInit & { cookie?: string } = {}) =>
  new Request(`https://reports.example.com${path}`, { ...init, headers: { accept: 'text/html', ...(init.cookie ? { cookie: init.cookie } : {}), ...(init.headers ?? {}) } });

describe('config (fail closed)', () => {
  it('rejects missing or weak settings', () => {
    expect(gateConfigError(readGateEnv({}))).toMatch(/SITE_PASSWORD/);
    expect(gateConfigError(readGateEnv({ SITE_PASSWORD: 'short', SESSION_SECRET: 'x'.repeat(40) }))).toMatch(/SITE_PASSWORD/);
    expect(gateConfigError(readGateEnv({ SITE_PASSWORD: 'long enough pw', SESSION_SECRET: 'short' }))).toMatch(/SESSION_SECRET/);
    expect(gateConfigError(env)).toBeNull();
  });
  it('blocks everything when not configured', async () => {
    const r = await gateRequest(req('/admin'), readGateEnv({}));
    expect(r?.status).toBe(503);
    expect(await passwordMatches(readGateEnv({}), '')).toBe(false);
  });
});

describe('password', () => {
  it('matches only the exact password', async () => {
    expect(await passwordMatches(env, 'correct horse battery')).toBe(true);
    expect(await passwordMatches(env, 'correct horse batter')).toBe(false);
    expect(await passwordMatches(env, '')).toBe(false);
  });
});

describe('session tokens', () => {
  it('verifies a fresh token', async () => {
    expect(await verifySessionToken(env, await createSessionToken(env))).toBe(true);
  });
  it('rejects tampered, malformed and expired tokens', async () => {
    const t = await createSessionToken(env);
    const [exp, sig] = t.split('.');
    expect(await verifySessionToken(env, `${Number(exp) + 99999}.${sig}`)).toBe(false);
    const flipped = (sig![0] === 'A' ? 'B' : 'A') + sig!.slice(1);
    expect(await verifySessionToken(env, `${exp}.${flipped}`)).toBe(false);
    expect(await verifySessionToken(env, 'garbage')).toBe(false);
    expect(await verifySessionToken(env, null)).toBe(false);
    const old = await createSessionToken(env, Date.now() - 13 * 3600_000);
    expect(await verifySessionToken(env, old)).toBe(false);
  });
  it('is invalidated by changing the password or the secret', async () => {
    const t = await createSessionToken(env);
    expect(await verifySessionToken({ ...env, password: 'a different password' }, t)).toBe(false);
    expect(await verifySessionToken({ ...env, secret: 'y'.repeat(40) }, t)).toBe(false);
  });
});

describe('gate', () => {
  it('shows the password page for pages and 401 for assets and API without a session', async () => {
    const page = await gateRequest(req('/admin/clients/1'), env);
    expect(page?.status).toBe(401);
    const html = await page!.text();
    expect(html).toContain('name="password"');
    expect(html).not.toMatch(/<script/i);
    expect((await gateRequest(req('/assets/index.js', { headers: { accept: '*/*;q=0.8,application/javascript' } }), env))?.status).toBe(401);
    expect((await gateRequest(req('/api/rpc', { method: 'POST' }), env))?.status).toBe(401);
  });
  it('lets a valid session through and allows the login endpoint', async () => {
    const t = await createSessionToken(env);
    expect(await gateRequest(req('/admin', { cookie: `__Host-ro_session=${t}` }), env)).toBeNull();
    expect(await gateRequest(req('/api/login', { method: 'POST' }), env)).toBeNull();
    // Cookie under the wrong name (e.g. set over http) is not accepted on https.
    expect((await gateRequest(req('/admin', { cookie: `ro_session=${t}` }), env))?.status).toBe(401);
  });
});

describe('login', () => {
  const post = (password: string, origin = 'https://reports.example.com', ip = '9.9.9.9') =>
    new Request('https://reports.example.com/api/login', {
      method: 'POST',
      headers: { origin, 'content-type': 'application/x-www-form-urlencoded', 'x-real-ip': ip },
      body: new URLSearchParams({ password, next: '/admin' }),
    });
  it('sets a hardened cookie and redirects on success', async () => {
    const r = await handleLogin(post('correct horse battery'), env, null);
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/admin');
    const c = r.headers.get('set-cookie')!;
    expect(c).toMatch(/^__Host-ro_session=/);
    expect(c).toContain('HttpOnly');
    expect(c).toContain('Secure');
    expect(c).toContain('SameSite=Lax');
  });
  it('rejects wrong passwords and cross-site posts', async () => {
    expect((await handleLogin(post('nope', undefined, '1.1.1.1'), env, null)).status).toBe(401);
    expect((await handleLogin(post('correct horse battery', 'https://evil.example'), env, null)).status).toBe(403);
  });
  it('locks an IP out after repeated failures', async () => {
    for (let i = 0; i < 10; i++) await handleLogin(post('wrong', undefined, '5.5.5.5'), env, null);
    const r = await handleLogin(post('correct horse battery', undefined, '5.5.5.5'), env, null);
    expect(r.status).toBe(429);
  }, 20_000);
});

describe('safeNext', () => {
  it('only allows same-site relative paths', () => {
    expect(safeNext('/admin?x=1')).toBe('/admin?x=1');
    expect(safeNext('//evil.com')).toBe('/');
    expect(safeNext('/\\evil.com')).toBe('/');
    expect(safeNext('https://evil.com')).toBe('/');
    expect(safeNext('/api/rpc')).toBe('/');
  });
});
