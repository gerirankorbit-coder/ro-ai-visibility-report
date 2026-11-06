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
