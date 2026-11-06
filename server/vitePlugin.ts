import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin } from 'vite';
import { serverDb } from './db.js';
import { gateRequest } from './gate.js';
import { handleLogin, handleLogout } from './login.js';
import { handleRpc } from './rpc.js';
import { handleMedia } from './media.js';
import { readGateEnv } from './session.js';

type EnvLike = Record<string, string | undefined>;

async function toRequest(req: IncomingMessage): Promise<Request> {
  const url = `http://${req.headers.host ?? 'localhost'}${req.url ?? '/'}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
  else if (Array.isArray(v)) headers.set(k, v.join(', '));
  let body: ArrayBuffer | undefined;
  if (req.method && !['GET', 'HEAD'].includes(req.method)) {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const buf = Buffer.concat(chunks);
    body = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  }
  return new Request(url, { method: req.method, headers, body });
}

async function send(res: ServerResponse, r: Response) {
  res.statusCode = r.status;
  r.headers.forEach((v, k) => res.setHeader(k, v));
  res.end(Buffer.from(await r.arrayBuffer()));
}

/** Runs the same password gate and /api handlers as production inside `vite` and `vite preview`. */
export function privateGate(env: EnvLike): Plugin {
  const gateEnv = readGateEnv(env);
  const db = serverDb(env);
  const mw: Connect.NextHandleFunction = (req, res, next) => {
    void (async () => {
      try {
        const request = await toRequest(req);
        const path = new URL(request.url).pathname;
        const blocked = await gateRequest(request, gateEnv);
        if (blocked) return send(res, blocked);
        if (path === '/api/login') return send(res, await handleLogin(request, gateEnv, db));
        if (path === '/api/logout') return send(res, handleLogout(request));
        if (path === '/api/rpc') return send(res, await handleRpc(request, gateEnv, db));
        if (path === '/api/media') return send(res, await handleMedia(request, gateEnv, db));
        next();
      } catch (e) {
        next(e);
      }
    })();
  };
  return {
    name: 'rank-orbit-private-gate',
    configureServer(server) {
      server.middlewares.use(mw);
    },
    configurePreviewServer(server) {
      server.middlewares.use(mw);
    },
  };
}
