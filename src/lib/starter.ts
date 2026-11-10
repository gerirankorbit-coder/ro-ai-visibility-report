import { GbpSummarySchema, type MonthInput, type SourceStatus } from '@/types/schema';
import { DIRECTORIES } from './constants';
import { defaultForum, emptyMonthInput } from './defaults';
import { clamp } from './metrics';

/**
 * Starter template for a new client's first month: plausible *baseline* values (what an initial
 * audit typically looks like), slightly different every time. The month is marked `starter: true`
 * and saved as a draft, so the admin keeps reminding staff to replace them with real numbers.
 */
export function starterMonthInput(period: string, rand: () => number = Math.random): MonthInput {
  const r = (a: number, b: number) => Math.round(a + rand() * (b - a));
  const near = (base: number, spread: number, lo = 0, hi = 100) => clamp(r(base - spread, base + spread), lo, hi);

  const nap = r(52, 72);
  const entity = r(22, 42);
  const schema = r(10, 35);
  const kg = r(5, 25);

  // Directory statuses: a few verified/updated, some in progress, the rest queued.
  const verified = r(2, 4);
  const synced = r(0, 2);
  const progress = r(1, 3);
  const key = period.slice(0, 7);
  const sources = DIRECTORIES.map((name, i) => {
    const status: SourceStatus = i < verified ? 'verified' : i < verified + synced ? 'synced' : i < verified + synced + progress ? 'progress' : 'queued';
    return { name, status, updated_at: status === 'queued' ? null : `${key}-${String(r(2, 27)).padStart(2, '0')}` };
  });

  const created = r(2, 5);
  const active = r(0, 1);
  const forum = {
    ...defaultForum(),
    rCreated: created,
    rActive: active,
    rWarming: created - active,
    rKarma: r(10, 60),
    rCommunities: r(1, 4),
    qProfiles: r(1, 2),
    qActive: r(0, 1),
    fProfiles: r(1, 2),
    fActive: 0,
    weekly: [r(3, 8), r(4, 10), r(5, 11), r(6, 12)] as [number, number, number, number],
    phase: 1,
    authority: r(3, 12),
  };

  const ok = { status: 'OK', tone: 'orange' as const };
  return {
    ...emptyMonthInput(period),
    nap,
    entity,
    schema_cov: schema,
    knowledge: kg,
    mentions: r(0, 8),
    nap_fields: {
      name: r(82, 100),
      address: near(nap, 8),
      phone: near(nap + 4, 6),
      hours: near(nap - 10, 8),
      website: near(nap + 2, 8),
    },
    entity_parts: {
      schema,
      sameAs: near(entity - 4, 8),
      kg,
      reviews: near(entity + 8, 8),
      mentions: near(entity - 14, 8),
      topical: near(entity - 2, 8),
    },
    engines: { aio: r(15, 35), chatgpt: r(10, 30), perplexity: r(12, 32), gemini: r(8, 25), copilot: r(5, 22) },
    work: { nap: r(8, 18), entity: r(4, 12), schema: r(1, 5), content: r(2, 6) },
    sources,
    forum,
    note: 'Baseline audit completed. Core listings reviewed and the first corrections are under way.',
    gbp_summary: GbpSummarySchema.parse({
      links: ok,
      rank: ok,
      gbp: ok,
      onsite: ok,
      mode: 'monthly',
      vt: { sd: r(20, 90), sm: r(200, 800), md: r(10, 60), mm: r(150, 650) },
      at: { web: r(0, 20), dir: r(20, 80), call: r(0, 8) },
      calls: Array.from({ length: 7 }, (_, i) => (i < 5 ? r(0, 3) : r(0, 1))),
    }),
    published: false,
    locked: false,
    starter: true,
  };
}

/** First day of last calendar month, `YYYY-MM-01` (reports cover the month just finished). */
export function previousMonthPeriod(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
