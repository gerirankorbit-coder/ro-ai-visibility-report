/**
 * Demo dataset, ported 1:1 from the mockup generator (same seeded RNG and ramps),
 * converted to the production data model. Used by /demo and by the seed script.
 */
import type { Client, HoursDay, Month, Report, SourceStatus } from '@/types/schema';
import { DAY_NAMES } from '@/types/schema';
import { DIRECTORIES } from './constants';
import { nextMonthKey } from './format';
import { clamp } from './metrics';
import { rng } from './rng';

type Range = readonly [number, number];
interface Params {
  nap: Range; entity: Range; schema: Range; kg: Range; men: Range; eng: Range; ver: Range; src: number;
  rc: Range; ra: Range; wk: Range; karma: Range; com: Range; q: Range; f: Range; ph: number; auth: Range;
  work: readonly [number, number, number, number];
}

function ramp(a: number, b: number, n: number, i: number, r: () => number, j = 2): number {
  const t = n < 2 ? 1 : i / (n - 1);
  const e = 1 - Math.pow(1 - t, 1.35);
  return Math.round(a + (b - a) * e + (i === 0 || i === n - 1 ? 0 : (r() - 0.5) * 2 * j));
}

function sourceDate(key: string, ix: number): string {
  const day = 3 + ((ix * 7) % 24);
  return `${key}-${String(day).padStart(2, '0')}`;
}

function buildMonths(clientId: string, seed: string, startKey: string, n: number, P: Params, notes: string[]): Month[] {
  const r = rng(seed);
  const out: Month[] = [];
  let k = startKey;
  for (let i = 0; i < n; i++) {
    const R = (a: number, b: number, j: number) => clamp(ramp(a, b, n, i, r, j));
    const ver = Math.round(P.ver[0] + (P.ver[1] - P.ver[0]) * (n < 2 ? 1 : i / (n - 1)));
    const sources = DIRECTORIES.slice(0, P.src).map((name, ix) => {
      const status: SourceStatus = ix < ver ? 'verified' : ix < ver + 2 ? 'synced' : ix < ver + 3 ? 'progress' : 'queued';
      return { name, status, updated_at: status === 'queued' ? null : sourceDate(k, ix) };
    });
    const created = ramp(P.rc[0], P.rc[1], n, i, r, 0);
    const active = Math.min(created, ramp(P.ra[0], P.ra[1], n, i, r, 0));
    const wk = [0, 1, 2, 3].map((w) =>
      Math.max(0, Math.round(ramp(P.wk[0], P.wk[1], n, i, r, 3) * (0.82 + w * 0.09 + (r() - 0.5) * 0.12))),
    ) as [number, number, number, number];
    // Evaluation order below mirrors the mockup object literal exactly.
    const nap = R(P.nap[0], P.nap[1], 2);
    const entity = R(P.entity[0], P.entity[1], 2);
    const schema_cov = R(P.schema[0], P.schema[1], 3);
    const knowledge = R(P.kg[0], P.kg[1], 2);
    const mentions = Math.max(0, ramp(P.men[0], P.men[1], n, i, r, 1));
    const nap_fields = {
      name: R(P.nap[0] + 30, 100, 0),
      address: R(P.nap[0] + 2, P.nap[1] + 3, 3),
      phone: R(P.nap[0] + 10, P.nap[1] + 6, 2),
      hours: R(P.nap[0] - 14, P.nap[1] - 3, 3),
      website: R(P.nap[0] + 8, P.nap[1] + 5, 2),
    };
    const entity_parts = {
      schema: R(P.schema[0], P.schema[1], 3),
      sameAs: R(P.entity[0] - 8, P.entity[1] + 8, 3),
      kg: R(P.kg[0], P.kg[1], 3),
      reviews: R(P.entity[0] + 8, P.entity[1] + 6, 2),
      mentions: R(P.entity[0] - 18, P.entity[1] - 12, 3),
      topical: R(P.entity[0] - 4, P.entity[1] - 2, 3),
    };
    const engines = {
      aio: R(P.eng[0], P.eng[1], 3),
      chatgpt: R(P.eng[0] - 4, P.eng[1] - 7, 3),
      perplexity: R(P.eng[0] + 3, P.eng[1] - 3, 3),
      gemini: R(P.eng[0] - 7, P.eng[1] - 15, 3),
      copilot: R(P.eng[0] - 10, P.eng[1] - 20, 3),
    };
    const work = {
      nap: ramp(P.work[0], P.work[0] + 12, n, i, r, 4),
      entity: ramp(P.work[1], P.work[1] + 14, n, i, r, 3),
      schema: ramp(P.work[2], P.work[2] + 6, n, i, r, 2),
      content: ramp(P.work[3], P.work[3] + 8, n, i, r, 2),
    };
    const t = n < 2 ? 1 : i / (n - 1);
    const forum = {
      rCreated: created,
      rWarming: created - active,
      rActive: active,
      rKarma: Math.round(P.karma[0] + (P.karma[1] - P.karma[0]) * Math.pow(t, 1.7)),
      rCommunities: ramp(P.com[0], P.com[1], n, i, r, 0),
      qProfiles: P.q[0],
      qActive: ramp(0, P.q[1], n, i, r, 0),
      fProfiles: ramp(1, P.f[0], n, i, r, 0),
      fActive: ramp(0, P.f[1], n, i, r, 0),
      weekly: wk,
      phase: Math.min(4, 1 + Math.floor(t * P.ph)),
      authority: R(P.auth[0], P.auth[1], 2),
    };
    out.push({
      id: `${clientId}-${k}`,
      client_id: clientId,
      period: `${k}-01`,
      published: true,
      nap, entity, schema_cov, knowledge, mentions,
      nap_fields, entity_parts, engines, work, sources, forum,
      note: notes[i] ?? '',
      updated_at: null,
    });
    k = nextMonthKey(k);
  }
  return out;
}

function hours(o: string, c: string, sat: readonly [string, string] | null, sun: readonly [string, string] | null): HoursDay[] {
  return DAY_NAMES.map((day, i) => {
    if (i < 5) return { day, open: o, close: c, closed: false };
    const v = i === 5 ? sat : sun;
    return v ? { day, open: v[0], close: v[1], closed: false } : { day, open: '', close: '', closed: true };
  });
}

export const DEMO_IDS = {
  summit: '6f1c2a3e-0b7d-4c55-9a51-1d2e3f4a5b01',
  harbor: '6f1c2a3e-0b7d-4c55-9a51-1d2e3f4a5b02',
} as const;

const summit: Client = {
  id: DEMO_IDS.summit,
  name: 'Summit Peak Plumbing & Drain',
  category: 'Plumber · Emergency Plumbing Service',
  address: '4821 W Colfax Ave, Suite 3',
  locality: 'Denver, CO 80204',
  phone: '(303) 555-0148',
  website: 'summitpeakplumbing.com',
  services: ['Emergency Plumbing', 'Drain Cleaning', 'Water Heater Repair', 'Sewer Line Repair', 'Leak Detection'],
  brand_color: '#2F63D8',
  logo_path: null,
  client_since: '2026-06-01',
  hours: hours('7:00 AM', '7:00 PM', ['8:00 AM', '4:00 PM'], null),
  created_at: null,
};

const harbor: Client = {
  id: DEMO_IDS.harbor,
  name: 'Harbor Line Dental Studio',
  category: 'Dentist · Cosmetic Dentistry',
  address: '1250 Rosecrans St, Unit B',
  locality: 'San Diego, CA 92106',
  phone: '(619) 555-0192',
  website: 'harborlinedental.com',
  services: ['Teeth Whitening', 'Invisalign', 'Dental Implants', 'Family Dentistry', 'Veneers'],
  brand_color: '#0E9C95',
  logo_path: null,
  client_since: '2026-08-01',
  hours: hours('8:00 AM', '5:00 PM', ['9:00 AM', '2:00 PM'], null),
  created_at: null,
};

export const DEMO_REPORTS: Record<'summit' | 'harbor', Report> = {
  summit: {
    client: { ...summit, logo_url: null },
    months: buildMonths(summit.id, 'summit', '2026-06', 5,
      { nap: [58, 91], entity: [34, 72], schema: [20, 85], kg: [15, 58], men: [4, 27], eng: [22, 64], ver: [3, 9], src: 12, rc: [4, 10], ra: [0, 7], wk: [9, 58], karma: [40, 1850], com: [3, 14], q: [3, 3], f: [4, 3], ph: 3, auth: [8, 52], work: [18, 10, 4, 6] },
      [
        'Baseline audit completed. Core listings claimed and duplicate profiles flagged for removal.',
        'Address and hours aligned on major directories. LocalBusiness schema deployed on homepage.',
        'Entity profile links connected across social and directory profiles. Service-area pages structured for AI parsing.',
        'Knowledge graph signals strengthened. First brand mentions recorded in community discussions.',
        'NAP accuracy above 90%. AI Overview readiness improved across all tracked engines.',
      ]),
  },
  harbor: {
    client: { ...harbor, logo_url: null },
    months: buildMonths(harbor.id, 'harbor', '2026-08', 3,
      { nap: [49, 77], entity: [22, 46], schema: [10, 60], kg: [8, 31], men: [1, 9], eng: [14, 38], ver: [2, 6], src: 10, rc: [3, 6], ra: [0, 3], wk: [6, 28], karma: [15, 520], com: [2, 7], q: [2, 2], f: [2, 1], ph: 2, auth: [5, 26], work: [14, 8, 3, 4] },
      [
        'Onboarding audit. Listing inconsistencies mapped across 10 directories.',
        'Phone and hours corrected on priority listings. Schema foundation added.',
        'Entity linking in progress. Community profiles moved from setup into trust building.',
      ]),
  },
};

export type DemoKey = keyof typeof DEMO_REPORTS;
export const DEMO_KEYS = Object.keys(DEMO_REPORTS) as DemoKey[];
