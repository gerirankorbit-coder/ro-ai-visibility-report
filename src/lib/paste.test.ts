import { describe, expect, it } from 'vitest';
import { parseRows } from './paste';

describe('parseRows (pasted BrightLocal / spreadsheet data)', () => {
  it('reads tab-separated rows and skips headers', () => {
    const r = parseRows('Date\tSearch Desktop\tSearch Mobile\tMaps Desktop\tMaps Mobile\nOct 6\t3\t5\t2\t1\nOct 7\t0\t1\t0\t4', 4);
    expect(r).toEqual([
      { date: 'Oct 6', values: [3, 5, 2, 1] },
      { date: 'Oct 7', values: [0, 1, 0, 4] },
    ]);
  });
  it('reads comma- and space-separated rows', () => {
    expect(parseRows('2026-10-01, 2, 3, 4', 3)).toEqual([{ date: '2026-10-01', values: [2, 3, 4] }]);
    expect(parseRows('Oct 2   7  8  9', 3)).toEqual([{ date: 'Oct 2', values: [7, 8, 9] }]);
  });
  it('ignores lines without enough numbers', () => {
    expect(parseRows('Total Views: 324\n\nOct 1 1 2', 4)).toEqual([]);
  });
});

describe('insights axis', () => {
  it('uses integer steps like BrightLocal', async () => {
    const { axis } = await import('@/features/report/GbpInsights');
    expect(axis(37)).toEqual({ max: 40, ticks: [0, 10, 20, 30, 40] });
    expect(axis(9)).toEqual({ max: 10, ticks: [0, 2, 4, 6, 8, 10] });
    expect(axis(3)).toEqual({ max: 3, ticks: [0, 1, 2, 3] });
    expect(axis(48)).toEqual({ max: 50, ticks: [0, 10, 20, 30, 40, 50] });
  });
});

describe('GBP insights: monthly totals', () => {
  it('defaults new months to monthly and keeps old daily months daily', async () => {
    const { GbpSummarySchema } = await import('@/types/schema');
    expect(GbpSummarySchema.parse({}).mode).toBe('monthly');
    expect(GbpSummarySchema.parse({ views: [{ date: 'Oct 6', sd: 1, sm: 2, md: 3, mm: 4 }] }).mode).toBe('daily');
    expect(GbpSummarySchema.parse({ mode: 'monthly', views: [{ date: 'Oct 6', sd: 1, sm: 2, md: 3, mm: 4 }] }).mode).toBe('monthly');
  });
  it('sums daily rows into totals and builds a month-by-month trend', async () => {
    const { GbpSummarySchema } = await import('@/types/schema');
    const { totalsOf, buildTrend } = await import('@/features/report/GbpInsights');
    const { DEMO_REPORTS } = await import('./demo');
    const daily = GbpSummarySchema.parse({ views: [{ date: 'a', sd: 1, sm: 2, md: 3, mm: 4 }, { date: 'b', sd: 1, sm: 1, md: 1, mm: 1 }], actions: [{ date: 'a', web: 1, dir: 2, call: 0 }] });
    expect(totalsOf(daily)).toEqual({ vt: { sd: 2, sm: 3, md: 4, mm: 5 }, at: { web: 1, dir: 2, call: 0 } });
    const ms = DEMO_REPORTS.summit.months;
    const trend = buildTrend(ms, ms[ms.length - 1]!);
    expect(trend.map((t) => t.label)).toEqual(['Jun', 'Jul', 'Aug', 'Sep', 'Oct']);
    expect(trend[4]!.vt).toEqual(ms[4]!.gbp_summary.vt);
    expect(buildTrend(ms, ms[1]!)).toHaveLength(2);
  });
});
