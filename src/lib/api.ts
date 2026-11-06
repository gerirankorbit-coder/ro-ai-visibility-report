/**
 * Browser data layer. All reads and writes go to the private /api/rpc endpoint, which checks the
 * session cookie on every call and talks to Supabase with a server-only key. The browser never
 * holds a database key.
 */
import { ClientSchema, type Client, type ClientInput, type Month, type MonthInput } from '@/types/schema';
import { normalizeMonth } from './defaults';
import { NoteSchema, type Note } from '@/types/gmb';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function rpc<T>(op: string, args: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch('/api/rpc', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op, ...args }),
  });
  if (res.status === 401) {
    // Session expired or password changed: reload to show the password screen.
    window.location.reload();
    throw new ApiError('Signed out', 401);
  }
  const body = (await res.json().catch(() => ({}))) as { data?: T; error?: string; details?: string[] };
  if (!res.ok) throw new ApiError(body.details?.length ? `${body.error}: ${body.details.join('; ')}` : (body.error ?? `Request failed (${res.status})`), res.status);
  return body.data as T;
}

export async function signOut(): Promise<void> {
  await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
  window.location.href = '/';
}

/* ------------------------------------------------------------------ */
/* Clients                                                             */
/* ------------------------------------------------------------------ */

export interface ClientListRow {
  client: Client;
  latest: Month | null;
}

export async function listClients(): Promise<ClientListRow[]> {
  const [clients, months] = await Promise.all([rpc<unknown[]>('clients.list'), rpc<Array<Record<string, unknown>>>('months.listAll')]);
  return clients.map((row) => {
    const client = ClientSchema.parse(row);
    const m = months.filter((x) => x.client_id === client.id).sort((a, b) => String(b.period).localeCompare(String(a.period)))[0];
    return { client, latest: m ? normalizeMonth(m) : null };
  });
}

export async function getClient(id: string): Promise<Client> {
  return ClientSchema.parse(await rpc('clients.get', { id }));
}

export async function createClientRow(input: ClientInput): Promise<Client> {
  return ClientSchema.parse(await rpc('clients.create', { input }));
}

export async function updateClientRow(id: string, input: ClientInput): Promise<Client> {
  return ClientSchema.parse(await rpc('clients.update', { id, input }));
}

export async function deleteClientRow(id: string): Promise<void> {
  await rpc('clients.delete', { id });
}

/* ------------------------------------------------------------------ */
/* Months                                                              */
/* ------------------------------------------------------------------ */

export async function listMonths(clientId: string): Promise<Month[]> {
  return (await rpc<Array<Record<string, unknown>>>('months.list', { clientId })).map((r) => normalizeMonth(r));
}

export async function createMonth(clientId: string, input: MonthInput): Promise<Month> {
  return normalizeMonth(await rpc<Record<string, unknown>>('months.create', { clientId, input }));
}

export async function updateMonth(id: string, input: MonthInput): Promise<Month> {
  return normalizeMonth(await rpc<Record<string, unknown>>('months.update', { id, input }));
}

export async function deleteMonth(id: string): Promise<void> {
  await rpc('months.delete', { id });
}

/* ------------------------------------------------------------------ */
/* Logos (private bucket, served as data URLs through the API)         */
/* ------------------------------------------------------------------ */

async function fileToBase64(file: File): Promise<string> {
  const url = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
  return url.slice(url.indexOf(',') + 1);
}

export async function uploadLogo(clientId: string, file: File): Promise<string> {
  return rpc<string>('logo.upload', { clientId, contentType: file.type, base64: await fileToBase64(file) });
}

export async function logoDataUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  return rpc<string | null>('logo.get', { path }).catch(() => null);
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

/* ------------------------------------------------------------------ */
/* Report screenshots (private bucket, streamed through /api/media)    */
/* ------------------------------------------------------------------ */

export const mediaUrl = (path: string) => `/api/media?path=${encodeURIComponent(path)}`;

const MAX_MEDIA_W = 1800;

/** Downscale large screenshots in the browser so uploads stay small and fast. */
async function prepareImage(file: File): Promise<{ type: 'image/png' | 'image/jpeg' | 'image/webp'; base64: string }> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Upload PNG, JPG or WebP images.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('Could not read that image.'));
      i.src = url;
    });
    const keep = img.naturalWidth <= MAX_MEDIA_W && file.size <= 1_500_000;
    if (keep) return { type: file.type as 'image/png', base64: await fileToBase64(file) };
    const scale = Math.min(1, MAX_MEDIA_W / img.naturalWidth);
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const data = c.toDataURL('image/jpeg', 0.9);
    return { type: 'image/jpeg', base64: data.slice(data.indexOf(',') + 1) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function uploadMedia(clientId: string, file: File): Promise<string> {
  const { type, base64 } = await prepareImage(file);
  return rpc<string>('media.upload', { clientId, contentType: type, base64 });
}

export async function deleteMedia(path: string): Promise<void> {
  await rpc('media.delete', { path }).catch(() => undefined);
}

/* ------------------------------------------------------------------ */
/* Monthly Google update note (shared by all clients)                  */
/* ------------------------------------------------------------------ */

export async function listNotes(): Promise<Note[]> {
  return (await rpc<unknown[]>('notes.list')).map((n) => NoteSchema.parse(n));
}
export async function getNote(period: string): Promise<Note | null> {
  const n = await rpc<unknown | null>('notes.get', { period });
  return n ? NoteSchema.parse(n) : null;
}
export async function saveNote(note: Note): Promise<Note> {
  return NoteSchema.parse(await rpc('notes.upsert', { note }));
}
export async function deleteNote(period: string): Promise<void> {
  await rpc('notes.delete', { period });
}
