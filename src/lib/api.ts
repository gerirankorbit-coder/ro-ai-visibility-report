import { ClientSchema, ReportSchema, ShareLinkSchema, type Client, type ClientInput, type Month, type MonthInput, type Report, type ShareLink } from '@/types/schema';
import type { Json } from '@/types/database';
import { LOGO_BUCKET, sb } from './supabase';
import { normalizeMonth } from './defaults';

/* ------------------------------------------------------------------ */
/* Public report                                                       */
/* ------------------------------------------------------------------ */

function parseReport(raw: unknown): Report | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as { client?: unknown; months?: unknown[] };
  if (!r.client) return null;
  return ReportSchema.parse({
    client: r.client,
    months: (r.months ?? []).map((m) => normalizeMonth(m as Record<string, unknown>)),
  });
}

/**
 * Loads a report by share token. Prefers the `report` Edge Function (adds a 1-hour
 * signed logo URL); falls back to the `get_report` RPC directly. Returns null when the
 * token does not exist or has been revoked.
 */
export async function fetchReport(token: string): Promise<Report | null> {
  const client = sb();
  try {
    const { data, error } = await client.functions.invoke<unknown>('report', { body: { token } });
    if (!error) return parseReport(data);
  } catch {
    /* fall through to RPC */
  }
  const { data, error } = await client.rpc('get_report', { p_token: token });
  if (error) throw error;
  return parseReport(data);
}

/* ------------------------------------------------------------------ */
/* Staff: auth                                                         */
/* ------------------------------------------------------------------ */

export async function isStaff(): Promise<boolean> {
  const { data, error } = await sb().rpc('is_staff');
  if (error) return false;
  return Boolean(data);
}

/* ------------------------------------------------------------------ */
/* Staff: clients                                                      */
/* ------------------------------------------------------------------ */

export interface ClientListRow {
  client: Client;
  latest: Month | null;
  link: ShareLink | null;
}

export async function listClients(): Promise<ClientListRow[]> {
  const c = sb();
  const [clients, months, links] = await Promise.all([
    c.from('clients').select('*').order('name'),
    c.from('months').select('*').order('period', { ascending: false }),
    c.from('share_links').select('*').is('revoked_at', null).order('created_at', { ascending: false }),
  ]);
  if (clients.error) throw clients.error;
  if (months.error) throw months.error;
  if (links.error) throw links.error;
  return clients.data.map((row) => {
    const client = ClientSchema.parse(row);
    const m = months.data.find((x) => x.client_id === client.id);
    const l = links.data.find((x) => x.client_id === client.id);
    return { client, latest: m ? normalizeMonth(m) : null, link: l ? ShareLinkSchema.parse(l) : null };
  });
}

export async function getClient(id: string): Promise<Client> {
  const { data, error } = await sb().from('clients').select('*').eq('id', id).single();
  if (error) throw error;
  return ClientSchema.parse(data);
}

export async function createClientRow(input: ClientInput): Promise<Client> {
  const { data, error } = await sb()
    .from('clients')
    .insert({ ...input, hours: input.hours as unknown as Json })
    .select('*')
    .single();
  if (error) throw error;
  return ClientSchema.parse(data);
}

export async function updateClientRow(id: string, input: ClientInput): Promise<Client> {
  const { data, error } = await sb()
    .from('clients')
    .update({ ...input, hours: input.hours as unknown as Json })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return ClientSchema.parse(data);
}

export async function deleteClientRow(id: string): Promise<void> {
  const { error } = await sb().from('clients').delete().eq('id', id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/* Staff: months                                                       */
/* ------------------------------------------------------------------ */

export async function listMonths(clientId: string): Promise<Month[]> {
  const { data, error } = await sb().from('months').select('*').eq('client_id', clientId).order('period');
  if (error) throw error;
  return data.map((r) => normalizeMonth(r));
}

const monthPayload = (m: MonthInput) => ({
  period: m.period,
  published: m.published,
  nap: m.nap,
  entity: m.entity,
  schema_cov: m.schema_cov,
  knowledge: m.knowledge,
  mentions: m.mentions,
  nap_fields: m.nap_fields as unknown as Json,
  entity_parts: m.entity_parts as unknown as Json,
  engines: m.engines as unknown as Json,
  work: m.work as unknown as Json,
  sources: m.sources as unknown as Json,
  forum: m.forum as unknown as Json,
  note: m.note,
});

export async function createMonth(clientId: string, m: MonthInput): Promise<Month> {
  const { data, error } = await sb()
    .from('months')
    .insert({ client_id: clientId, ...monthPayload(m) })
    .select('*')
    .single();
  if (error) throw error;
  return normalizeMonth(data);
}

export async function updateMonth(id: string, m: MonthInput): Promise<Month> {
  const { data, error } = await sb()
    .from('months')
    .update({ ...monthPayload(m), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return normalizeMonth(data);
}

export async function deleteMonth(id: string): Promise<void> {
  const { error } = await sb().from('months').delete().eq('id', id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/* Staff: share links                                                  */
/* ------------------------------------------------------------------ */

/** 144 bits of randomness, base64url → 24 chars. */
export function generateToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function listShareLinks(clientId: string): Promise<ShareLink[]> {
  const { data, error } = await sb().from('share_links').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((r) => ShareLinkSchema.parse(r));
}

export async function createShareLink(clientId: string): Promise<ShareLink> {
  const { data, error } = await sb().from('share_links').insert({ token: generateToken(), client_id: clientId }).select('*').single();
  if (error) throw error;
  return ShareLinkSchema.parse(data);
}

export async function revokeShareLinks(clientId: string): Promise<void> {
  const { error } = await sb().from('share_links').update({ revoked_at: new Date().toISOString() }).eq('client_id', clientId).is('revoked_at', null);
  if (error) throw error;
}

export function shareUrl(token: string): string {
  const origin = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin;
  return `${origin.replace(/\/$/, '')}/r/${token}`;
}

/* ------------------------------------------------------------------ */
/* Staff: logos                                                        */
/* ------------------------------------------------------------------ */

export async function uploadLogo(clientId: string, file: File): Promise<string> {
  const ext = file.type === 'image/svg+xml' ? 'svg' : 'png';
  const path = `${clientId}/logo-${Date.now()}.${ext}`;
  const { error } = await sb().storage.from(LOGO_BUCKET).upload(path, file, { contentType: file.type, upsert: true, cacheControl: '3600' });
  if (error) throw error;
  return path;
}

export async function signedLogoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await sb().storage.from(LOGO_BUCKET).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

/** Validate a logo file: PNG or SVG, raster at least 512px on the short side. */
export async function validateLogo(file: File): Promise<string | null> {
  if (!['image/png', 'image/svg+xml'].includes(file.type)) return 'Upload a PNG or SVG file.';
  if (file.size > 2 * 1024 * 1024) return 'Logo must be 2 MB or smaller.';
  if (file.type === 'image/png') {
    const url = URL.createObjectURL(file);
    try {
      const { w, h } = await new Promise<{ w: number; h: number }>((res, rej) => {
        const img = new Image();
        img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = rej;
        img.src = url;
      });
      if (Math.min(w, h) < 512) return `PNG logos must be at least 512px (this one is ${w}×${h}).`;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return null;
}
