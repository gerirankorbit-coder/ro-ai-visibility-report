import { describe, expect, it } from 'vitest';
import {
  aiReadiness,
  buildMonthStatement,
  consistentListings,
  delta,
  engineAverage,
  monthWarnings,
  niceMax,
  readinessLevel,
  splitWeekly,
  totalWork,
} from './metrics';
import { DEMO_REPORTS } from './demo';
import { MonthSchema, ReportSchema } from '@/types/schema';
import type { Month } from '@/types/schema';

const summit = DEMO_REPORTS.summit;
const last = summit.months[summit.months.length - 1]!;
const prev = summit.months[summit.months.length - 2]!;

const base: Month = { ...last, nap: 80, entity: 60, schema_cov: 40, knowledge: 20, engines: { aio: 50, chatgpt: 50, perplexity: 50, gemini: 50, copilot: 50 } };

describe('aiReadiness', () => {
  it('applies the weighted formula', () => {
    // 80*.25 + 60*.25 + 40*.15 + 20*.10 + 50*.25 = 20 + 15 + 6 + 2 + 12.5 = 55.5 -> 56
    expect(aiReadiness(base)).toBe(56);
  });
  it('uses the unrounded engine average', () => {
    const m = { ...base, engines: { aio: 51, chatgpt: 50, perplexity: 50, gemini: 50, copilot: 50 } };
    expect(engineAverage(m)).toBeCloseTo(50.2);
    expect(aiReadiness(m)).toBe(56);
  });
  it('is 0 for an empty month and 100 for a perfect one', () => {
    const zero = { ...base, nap: 0, entity: 0, schema_cov: 0, knowledge: 0, engines: { aio: 0, chatgpt: 0, perplexity: 0, gemini: 0, copilot: 0 } };
    const full = { ...base, nap: 100, entity: 100, schema_cov: 100, knowledge: 100, engines: { aio: 100, chatgpt: 100, perplexity: 100, gemini: 100, copilot: 100 } };
    expect(aiReadiness(zero)).toBe(0);
    expect(aiReadiness(full)).toBe(100);
  });
});

describe('consistentListings', () => {
  it('counts verified and synced sources only', () => {
    const m = {
      sources: [
        { name: 'a', status: 'verified' as const, updated_at: null },
        { name: 'b', status: 'synced' as const, updated_at: null },
        { name: 'c', status: 'progress' as const, updated_at: null },
        { name: 'd', status: 'queued' as const, updated_at: null },
      ],
    };
    expect(consistentListings(m)).toBe(2);
  });
  it('matches the demo data (11 of 12 in the latest Summit month)', () => {
    expect(last.sources).toHaveLength(12);
    expect(consistentListings(last)).toBe(11);
  });
});

describe('delta', () => {
  it('returns null for the first month', () => {
    expect(delta(10, null)).toBeNull();
    expect(delta(10, undefined)).toBeNull();
  });
  it('returns the signed difference rounded to one decimal', () => {
    expect(delta(91, 87)).toBe(4);
    expect(delta(70, 72)).toBe(-2);
    expect(delta(5, 5)).toBe(0);
    expect(delta(1.26, 1)).toBe(0.3);
  });
});

describe('readinessLevel', () => {
  it.each([
    [100, 'Strong'], [80, 'Strong'], [79, 'Growing'], [60, 'Growing'], [59, 'Building'], [40, 'Building'], [39, 'Foundation'], [0, 'Foundation'],
  ] as const)('%i -> %s', (score, label) => {
    expect(readinessLevel(score)).toBe(label);
  });
});

describe('buildMonthStatement', () => {
  it('builds a two-part statement', () => {
    const s = buildMonthStatement(summit.client, last, prev);
    expect(s.lead).toBe(`This month we completed ${totalWork(last)} optimization tasks for Summit Peak Plumbing & Drain.`);
    expect(s.rest).toContain(`NAP accuracy rose to ${last.nap}%`);
    expect(s.rest).toContain('11 of 12 directories now match your business data.');
  });
  it('handles the first month', () => {
    const first = summit.months[0]!;
    const s = buildMonthStatement(summit.client, first, null);
    expect(s.rest).toContain(`NAP accuracy starts at ${first.nap}%`);
  });
});

describe('splitWeekly', () => {
  it('is deterministic', () => {
    expect(splitWeekly([10, 20, 30, 40], 'seed')).toEqual(splitWeekly([10, 20, 30, 40], 'seed'));
  });
  it('differs for different seeds', () => {
    expect(splitWeekly([50, 50, 50, 50], 'a')).not.toEqual(splitWeekly([50, 50, 50, 50], 'b'));
  });
  it('returns a 4x7 grid whose weeks sum to the weekly totals', () => {
    const weekly = [12, 0, 33, 58];
    const g = splitWeekly(weekly, 'x');
    expect(g).toHaveLength(4);
    g.forEach((row, i) => {
      expect(row).toHaveLength(7);
      expect(row.reduce((a, b) => a + b, 0)).toBe(weekly[i]);
      row.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
    });
  });
  it('weights weekends lower on average', () => {
    let wd = 0;
    let we = 0;
    for (let s = 0; s < 50; s++) {
      for (const row of splitWeekly([700, 700, 700, 700], `s${s}`)) {
        wd += row.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
        we += row.slice(5).reduce((a, b) => a + b, 0) / 2;
      }
    }
    expect(we).toBeLessThan(wd);
  });
});

describe('helpers', () => {
  it('niceMax', () => {
    expect(niceMax(0)).toBe(10);
    expect(niceMax(87)).toBe(100);
    expect(niceMax(1850)).toBe(2000);
    expect(niceMax(130)).toBe(200);
  });
  it('monthWarnings flags warm-up + active > created', () => {
    const m: Month = { ...last, forum: { ...last.forum, rCreated: 3, rWarming: 2, rActive: 2 } };
    expect(monthWarnings(m)).toHaveLength(1);
    expect(monthWarnings(last)).toHaveLength(0);
  });
});

describe('demo dataset', () => {
  it('matches the schemas', () => {
    expect(() => ReportSchema.parse(DEMO_REPORTS.summit)).not.toThrow();
    expect(() => ReportSchema.parse(DEMO_REPORTS.harbor)).not.toThrow();
    DEMO_REPORTS.harbor.months.forEach((m) => expect(() => MonthSchema.parse(m)).not.toThrow());
  });
  it('has 5 and 3 months', () => {
    expect(DEMO_REPORTS.summit.months.map((m) => m.period)).toEqual(['2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01', '2026-10-01']);
    expect(DEMO_REPORTS.harbor.months).toHaveLength(3);
  });
  it('reproduces the mockup end values', () => {
    expect(last.nap).toBe(91);
    expect(last.entity).toBe(72);
    expect(last.forum.rCreated).toBe(10);
    expect(last.forum.rKarma).toBe(1850);
  });
});
