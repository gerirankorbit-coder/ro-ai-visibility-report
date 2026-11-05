import type { Client, Month } from '@/types/schema';
import { ENGINES, WORK } from './constants';
import { rng } from './rng';

export const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));
export const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

type ScoreInput = Pick<Month, 'nap' | 'entity' | 'schema_cov' | 'knowledge' | 'engines'>;

/** Average AI engine readiness (unrounded). */
export function engineAverage(m: Pick<Month, 'engines'>): number {
  return avg(ENGINES.map(([k]) => n(m.engines[k])));
}

/** aiReadiness = round(nap*0.25 + entity*0.25 + schema*0.15 + knowledge*0.10 + avg(engines)*0.25) */
export function aiReadiness(m: ScoreInput): number {
  return Math.round(
    n(m.nap) * 0.25 + n(m.entity) * 0.25 + n(m.schema_cov) * 0.15 + n(m.knowledge) * 0.1 + engineAverage(m) * 0.25,
  );
}

export function consistentListings(m: Pick<Month, 'sources'>): number {
  return m.sources.filter((s) => s.status === 'verified' || s.status === 'synced').length;
}

export function verifiedListings(m: Pick<Month, 'sources'>): number {
  return m.sources.filter((s) => s.status === 'verified').length;
}

/** Difference vs previous month. `null` for the first month (rendered as "New"). */
export function delta(cur: number, prev: number | null | undefined): number | null {
  if (prev === null || prev === undefined) return null;
  return Math.round((cur - prev) * 10) / 10;
}

export type ReadinessLevel = 'Strong' | 'Growing' | 'Building' | 'Foundation';
export function readinessLevel(score: number): ReadinessLevel {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Growing';
  if (score >= 40) return 'Building';
  return 'Foundation';
}

export function totalWork(m: Pick<Month, 'work'>): number {
  return WORK.reduce((a, [k]) => a + n(m.work[k]), 0);
}

export function communityProfiles(m: Pick<Month, 'forum'>): number {
  return n(m.forum.rCreated) + n(m.forum.qProfiles) + n(m.forum.fProfiles);
}
export function communityActive(m: Pick<Month, 'forum'>): number {
  return n(m.forum.rActive) + n(m.forum.qActive) + n(m.forum.fActive);
}
export function weeklyTotal(m: Pick<Month, 'forum'>): number {
  return m.forum.weekly.reduce((a, b) => a + n(b), 0);
}

const pctPhrase = (label: string, cur: number, prev: number | null | undefined, verbUp: string) => {
  if (prev === null || prev === undefined) return `${label} starts at ${cur}%`;
  if (cur > prev) return `${label} ${verbUp} ${cur}%`;
  if (cur === prev) return `${label} held at ${cur}%`;
  return `${label} is at ${cur}%`;
};

/**
 * Two-tone statement for a month: `lead` renders in ink, `rest` continues in ghost grey.
 */
export function buildMonthStatement(
  client: Pick<Client, 'name'>,
  month: Month,
  prev: Month | null,
): { lead: string; rest: string } {
  const tasks = totalWork(month);
  const lead =
    tasks > 0
      ? `This month we completed ${tasks} optimization ${tasks === 1 ? 'task' : 'tasks'} for ${client.name}.`
      : `This month we continued the AI visibility program for ${client.name}.`;
  const cons = consistentListings(month);
  const total = month.sources.length;
  const nap = pctPhrase('NAP accuracy', month.nap, prev?.nap, 'rose to');
  const entity =
    prev && month.entity > prev.entity
      ? `entity strength reached ${month.entity}%`
      : pctPhrase('entity strength', month.entity, prev?.entity, 'reached');
  const listings =
    total === 0
      ? 'directory tracking is being set up'
      : `${cons} of ${total} ${total === 1 ? 'directory' : 'directories'} now ${cons === 1 ? 'matches' : 'match'} your business data`;
  return { lead, rest: `${nap}, ${entity}, and ${listings}.` };
}

/** Statement for the listing-consistency block. */
export function listingStatement(month: Month): { lead: string; rest: string } {
  const cons = consistentListings(month);
  const total = month.sources.length;
  const prog = month.sources.filter((s) => s.status === 'progress').length;
  const queued = month.sources.filter((s) => s.status === 'queued').length;
  const lead = `${cons} of ${total} directories now match your business data.`;
  const bits: string[] = [];
  if (prog) bits.push(`${prog === 1 ? 'One is' : `${prog} are`} in progress.`);
  if (queued) bits.push(`${queued === 1 ? 'One more is' : `${queued} more are`} queued for correction.`);
  if (!bits.length) bits.push('Every tracked listing is aligned.');
  return { lead, rest: bits.join(' ') };
}

/**
 * Deterministically split 4 weekly totals into a 4×7 day grid (Mon..Sun).
 * Weekends are weighted lower. Same input => same output.
 */
export function splitWeekly(weekly: readonly number[], seed: string): number[][] {
  const r = rng(seed);
  return [0, 1, 2, 3].map((w) => {
    const total = Math.max(0, Math.round(n(weekly[w])));
    const weights = Array.from({ length: 7 }, (_, d) => (d > 4 ? 0.45 : 0.8) + r() * 0.7);
    const sum = weights.reduce((a, b) => a + b, 0);
    const raw = weights.map((x) => (total * x) / sum);
    const out = raw.map((x) => Math.floor(x));
    // Largest-remainder rounding so each week sums exactly to its total.
    let rem = total - out.reduce((a, b) => a + b, 0);
    const order = raw.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    for (let k = 0; rem > 0 && k < order.length; k++, rem--) out[order[k]![1]]! += 1;
    return out;
  });
}

/** Round up to a "nice" axis maximum. */
export function niceMax(v: number): number {
  if (v <= 0) return 10;
  const e = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / e;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e;
}

/** Validation warnings for a month (shown inline in Admin). */
export function monthWarnings(m: Month): string[] {
  const w: string[] = [];
  const f = m.forum;
  if (f.rWarming + f.rActive > f.rCreated)
    w.push(`Reddit: in warm-up (${f.rWarming}) + active (${f.rActive}) is more than created (${f.rCreated}).`);
  if (f.qActive > f.qProfiles) w.push(`Quora: active (${f.qActive}) is more than profiles (${f.qProfiles}).`);
  if (f.fActive > f.fProfiles) w.push(`Niche forums: active (${f.fActive}) is more than profiles (${f.fProfiles}).`);
  return w;
}
