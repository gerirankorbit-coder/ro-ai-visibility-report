import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ClientSchema, MonthSchema } from '../src/types/schema.js';
import { SECURITY_HEADERS } from './gatePage.js';
import { isAuthenticated, sameOrigin, type GateEnv } from './session.js';

const uuid = z.string().uuid();
const ClientInput = ClientSchema.omit({ id: true, created_at: true }).strict();
const MonthInput = MonthSchema.omit({ id: true, client_id: true, updated_at: true }).strict();
const LOGO_TYPES = ['image/png', 'image/svg+xml'] as const;

const Body = z.discriminatedUnion('op', [
  z.object({ op: z.literal('clients.list') }),
  z.object({ op: z.literal('clients.get'), id: uuid }),
  z.object({ op: z.literal('clients.create'), input: ClientInput }),
  z.object({ op: z.literal('clients.update'), id: uuid, input: ClientInput }),
  z.object({ op: z.literal('clients.delete'), id: uuid }),
  z.object({ op: z.literal('months.listAll') }),
  z.object({ op: z.literal('months.list'), clientId: uuid }),
  z.object({ op: z.literal('months.create'), clientId: uuid, input: MonthInput }),
  z.object({ op: z.literal('months.update'), id: uuid, input: MonthInput }),
  z.object({ op: z.literal('months.delete'), id: uuid }),
  z.object({ op: z.literal('months.setLock'), id: uuid, locked: z.boolean() }),
  z.object({ op: z.literal('logo.upload'), clientId: uuid, contentType: z.enum(LOGO_TYPES), base64: z.string().max(3_000_000) }),
  z.object({ op: z.literal('logo.get'), path: z.string().regex(/^[0-9a-f-]{36}\/logo-\d+\.(png|svg)$/) }),
]);

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json' } });

function unwrap<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function encodeBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

async function isLocked(db: SupabaseClient, id: string): Promise<boolean> {
  const { data } = await db.from('months').select('locked').eq('id', id).maybeSingle();
  return Boolean((data as { locked?: boolean } | null)?.locked);
}

/** Single authenticated data endpoint. Every call re-checks the session (defence in depth). */
export async function handleRpc(req: Request, env: GateEnv, db: SupabaseClient | null): Promise<Response> {
  if (!(await isAuthenticated(req, env))) return json(401, { error: 'unauthorized' });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  if (!sameOrigin(req)) return json(403, { error: 'forbidden' });
  if (!db) return json(503, { error: 'database_not_configured' });

  let body: z.infer<typeof Body>;
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json(400, { error: 'invalid_request', details: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`) });
    body = parsed.data;
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  try {
    switch (body.op) {
      case 'clients.list':
        return json(200, { data: unwrap(await db.from('clients').select('*').order('name')) });
      case 'clients.get':
        return json(200, { data: unwrap(await db.from('clients').select('*').eq('id', body.id).single()) });
      case 'clients.create':
        return json(200, { data: unwrap(await db.from('clients').insert(body.input).select('*').single()) });
      case 'clients.update':
        return json(200, { data: unwrap(await db.from('clients').update(body.input).eq('id', body.id).select('*').single()) });
      case 'clients.delete':
        unwrap(await db.from('clients').delete().eq('id', body.id));
        return json(200, { data: null });
      case 'months.listAll':
        return json(200, { data: unwrap(await db.from('months').select('*').order('period', { ascending: false })) });
      case 'months.list':
        return json(200, { data: unwrap(await db.from('months').select('*').eq('client_id', body.clientId).order('period')) });
      case 'months.create':
        return json(200, { data: unwrap(await db.from('months').insert({ client_id: body.clientId, ...body.input, locked: false }).select('*').single()) });
      case 'months.update': {
        // A locked month cannot be changed; lock state only changes through months.setLock.
        if (await isLocked(db, body.id)) return json(409, { error: 'This month is locked. Unlock it to make changes.' });
        const { locked: _ignored, ...input } = body.input;
        return json(200, { data: unwrap(await db.from('months').update({ ...input, updated_at: new Date().toISOString() }).eq('id', body.id).select('*').single()) });
      }
      case 'months.delete':
        if (await isLocked(db, body.id)) return json(409, { error: 'This month is locked. Unlock it before deleting.' });
        unwrap(await db.from('months').delete().eq('id', body.id));
        return json(200, { data: null });
      case 'months.setLock':
        return json(200, { data: unwrap(await db.from('months').update({ locked: body.locked }).eq('id', body.id).select('*').single()) });
      case 'logo.upload': {
        const bytes = decodeBase64(body.base64);
        if (bytes.length > 2 * 1024 * 1024) return json(413, { error: 'Logo must be 2 MB or smaller.' });
        const path = `${body.clientId}/logo-${Date.now()}.${body.contentType === 'image/svg+xml' ? 'svg' : 'png'}`;
        unwrap(await db.storage.from('logos').upload(path, bytes, { contentType: body.contentType, upsert: false }));
        return json(200, { data: path });
      }
      case 'logo.get': {
        const { data, error } = await db.storage.from('logos').download(body.path);
        if (error || !data) return json(200, { data: null });
        const type = body.path.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
        return json(200, { data: `data:${type};base64,${encodeBase64(new Uint8Array(await data.arrayBuffer()))}` });
      }
    }
  } catch (e) {
    console.error('rpc error', body.op, e);
    return json(500, { error: e instanceof Error ? e.message : 'server_error' });
  }
}
