import { describe, expect, it } from 'vitest';
import { MonthSchema } from '@/types/schema';
import { previousMonthPeriod, starterMonthInput } from './starter';
import { rng } from './rng';

describe('starter template', () => {
  it('produces a valid draft month marked as starter', () => {
    const m = starterMonthInput('2026-10-01');
    expect(() => MonthSchema.parse({ ...m, id: 'x', client_id: 'y' })).not.toThrow();
    expect(m.starter).toBe(true);
    expect(m.published).toBe(false);
    expect(m.locked).toBe(false);
  });
  it('stays in baseline ranges and keeps profile counts consistent', () => {
    for (let i = 0; i < 200; i++) {
      const m = starterMonthInput('2026-10-01', rng(`t${i}`));
      expect(m.nap).toBeGreaterThanOrEqual(52);
      expect(m.nap).toBeLessThanOrEqual(72);
      expect(m.entity).toBeLessThanOrEqual(42);
      expect(m.forum.rWarming + m.forum.rActive).toBe(m.forum.rCreated);
      expect(m.sources).toHaveLength(12);
      Object.values(m.engines).forEach((v) => expect(v).toBeLessThanOrEqual(35));
    }
  });
  it('differs between runs', () => {
    const a = starterMonthInput('2026-10-01', rng('a'));
    const b = starterMonthInput('2026-10-01', rng('b'));
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });
  it('defaults to last calendar month', () => {
    expect(previousMonthPeriod(new Date(2026, 10, 10))).toBe('2026-10-01');
    expect(previousMonthPeriod(new Date(2027, 0, 5))).toBe('2026-12-01');
  });
});
