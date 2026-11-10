import type { Client, ClientInput, Forum, HoursDay, Month, MonthInput } from '@/types/schema';
import { DAY_NAMES, GbpSummarySchema, MonthSchema } from '@/types/schema';
import { DIRECTORIES } from './constants';

export const defaultForum = (): Forum => ({
  rCreated: 0, rWarming: 0, rActive: 0, rKarma: 0, rCommunities: 0,
  qProfiles: 0, qActive: 0, fProfiles: 0, fActive: 0,
  weekly: [0, 0, 0, 0], phase: 1, authority: 0,
});

export const defaultHours = (): HoursDay[] =>
  DAY_NAMES.map((day, i) => (i < 5 ? { day, open: '9:00 AM', close: '5:00 PM', closed: false } : { day, open: '', close: '', closed: true }));

export function emptyMonthInput(period: string): MonthInput {
  return {
    period,
    published: false,
    nap: 0, entity: 0, schema_cov: 0, knowledge: 0, mentions: 0,
    nap_fields: { name: 0, address: 0, phone: 0, hours: 0, website: 0 },
    entity_parts: { schema: 0, sameAs: 0, kg: 0, reviews: 0, mentions: 0, topical: 0 },
    engines: { aio: 0, chatgpt: 0, perplexity: 0, gemini: 0, copilot: 0 },
    work: { nap: 0, entity: 0, schema: 0, content: 0 },
    sources: DIRECTORIES.map((name) => ({ name, status: 'queued' as const, updated_at: null })),
    forum: defaultForum(),
    note: '',
    gbp_summary: GbpSummarySchema.parse({}),
    locked: false,
    starter: false,
  };
}

export function newClientInput(): ClientInput {
  const now = new Date();
  return {
    name: 'New Client Business',
    category: '',
    address: '',
    locality: '',
    phone: '',
    website: '',
    services: [],
    brand_color: '#0A0A0A',
    logo_path: null,
    client_since: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
    hours: defaultHours(),
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Coerce a DB row (nullable columns / partial JSON) into a valid Month. */
export function normalizeMonth(row: Record<string, unknown>): Month {
  const base = emptyMonthInput(String(row.period ?? '1970-01-01'));
  const merge = <T extends object>(def: T, v: unknown): T => (isObj(v) ? { ...def, ...v } : def);
  const forum = merge(base.forum, row.forum);
  const weekly = Array.isArray(forum.weekly) ? forum.weekly : base.forum.weekly;
  const candidate = {
    id: String(row.id),
    client_id: String(row.client_id),
    period: base.period,
    published: Boolean(row.published),
    nap: (row.nap as number | null) ?? 0,
    entity: (row.entity as number | null) ?? 0,
    schema_cov: (row.schema_cov as number | null) ?? 0,
    knowledge: (row.knowledge as number | null) ?? 0,
    mentions: (row.mentions as number | null) ?? 0,
    nap_fields: merge(base.nap_fields, row.nap_fields),
    entity_parts: merge(base.entity_parts, row.entity_parts),
    engines: merge(base.engines, row.engines),
    work: merge(base.work, row.work),
    sources: Array.isArray(row.sources)
      ? (row.sources as Array<Record<string, unknown>>).map((s) => ({ name: String(s.name ?? ''), status: s.status ?? 'queued', updated_at: (s.updated_at as string | null) ?? null }))
      : base.sources,
    forum: { ...forum, weekly: [0, 1, 2, 3].map((i) => Number(weekly[i] ?? 0)) },
    note: (row.note as string | null) ?? '',
    gbp_summary: isObj(row.gbp_summary) ? row.gbp_summary : {},
    locked: Boolean(row.locked),
    starter: Boolean(row.starter),
    updated_at: (row.updated_at as string | null) ?? null,
  };
  return MonthSchema.parse(candidate);
}

export function monthToInput(m: Month): MonthInput {
  const { id: _id, client_id: _c, updated_at: _u, ...rest } = m;
  return rest;
}

export function clientToInput(c: Client): ClientInput {
  const { id: _id, created_at: _c, ...rest } = c;
  return rest;
}
