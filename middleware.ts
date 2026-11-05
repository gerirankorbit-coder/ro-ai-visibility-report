/**
 * Vercel Routing Middleware: the whole site (pages, JS, CSS, fonts, /demo, /admin, /api) is
 * private. Requests without a valid session cookie get the password screen and nothing else.
 */
import { next } from '@vercel/functions';
import { gateRequest } from './server/gate.js';
import { readGateEnv } from './server/session.js';

export const config = { matcher: '/:path*' };

export default async function middleware(request: Request): Promise<Response> {
  const blocked = await gateRequest(request, readGateEnv(process.env));
  return blocked ?? next({ headers: { 'X-Robots-Tag': 'noindex, nofollow, noarchive' } });
}
