import { describe, expect, it } from 'vitest';
import { parseRows } from '@/features/admin/GmbEditor';
import { carryOverGmb, defaultGmb, GmbSchema } from '@/types/gmb';
import { DEMO_REPORTS } from './demo';

describe('parseRows (pasted BrightLocal / spreadsheet data)', () => {
  it('reads tab-separated rows and skips headers', () => {
    const r = parseRows('Date\tSearch Desktop\tSearch Mobile\tMaps Desktop\tMaps Mobile\nSep 4\t3\t5\t2\t1\nSep 5\t0\t1\t0\t4', 4);
    expect(r).toEqual([
      { date: 'Sep 4', values: [3, 5, 2, 1] },
      { date: 'Sep 5', values: [0, 1, 0, 4] },
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

describe('GMB report data', () => {
  it('fills defaults for an empty object (existing months)', () => {
    const g = GmbSchema.parse({});
    expect(g.sections.posting).toBe(true);
    expect(g.coverTitle).toBe('AI Optimization Report For:');
    expect(g.localSeo.groups.map((x) => x.title)).toEqual(['Video Submission', 'Articles Submission', 'Web 2.0', 'GMB Posting']);
    expect(g.insights.calls).toHaveLength(7);
  });
  it('carries setup to next month and clears monthly content', () => {
    const prev = GmbSchema.parse({
      sections: { posting: false },
      rankings: { location: 'Derry, NH', showRanks: false, keywords: [{ keyword: 'Roofing Derry', rank: '3' }] },
      posting: { images: ['a/b.png'] },
      backlinks: { images: ['a/c.png'] },
      localSeo: { groups: [{ title: 'Web 2.0', links: ['https://x.example'] }] },
      quora: { link: 'https://quora.example', linkLabel: 'Q' },
      insights: { views: [{ date: 'Oct 1', sd: 1, sm: 1, md: 1, mm: 1 }], calls: [1, 2, 3, 4, 5, 6, 7] },
    });
    const next = carryOverGmb(prev);
    expect(next.sections.posting).toBe(false);
    expect(next.rankings).toEqual(prev.rankings);
    expect(next.quora.link).toBe('https://quora.example');
    expect(next.posting.images).toEqual([]);
    expect(next.backlinks.images).toEqual([]);
    expect(next.localSeo.groups).toEqual([{ title: 'Web 2.0', links: [] }]);
    expect(next.insights.views).toEqual([]);
    expect(next.insights.calls).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
  it('demo months include valid report content', () => {
    for (const m of DEMO_REPORTS.summit.months) expect(() => GmbSchema.parse(m.gmb)).not.toThrow();
    expect(DEMO_REPORTS.summit.months[DEMO_REPORTS.summit.months.length - 1]!.gmb.rankings.keywords.length).toBeGreaterThan(5);
    expect(defaultGmb().sections.ai).toBe(true);
  });
});
