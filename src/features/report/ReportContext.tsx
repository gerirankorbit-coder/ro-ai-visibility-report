import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Month, Report } from '@/types/schema';
import { monthKey } from '@/lib/format';

export type ReportMode = 'demo' | 'client' | 'preview';

export interface ReportCtx {
  report: Report;
  /** Months visible in this surface, ordered by period. */
  months: Month[];
  current: Month;
  prev: Month | null;
  /** Months up to and including the current one. */
  history: Month[];
  currentKey: string;
  setMonth: (key: string) => void;
  /** Base path for section links, e.g. `/r/abc` or `/demo/summit`. */
  basePath: string;
  /** Link to a section, preserving the month query. */
  href: (slug: string) => string;
  mode: ReportMode;
}

const Ctx = createContext<ReportCtx | null>(null);

export function useReport(): ReportCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useReport must be used inside <ReportProvider>');
  return c;
}

export function sortMonths(months: Month[]): Month[] {
  return [...months].sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Provides the selected month (from `?m=YYYY-MM`, default latest) for a report.
 * `report.months` must be non-empty.
 */
export function ReportProvider({
  report,
  basePath,
  mode,
  children,
  monthOverride,
}: {
  report: Report;
  basePath: string;
  mode: ReportMode;
  children: ReactNode;
  /** Force a month (used by offscreen capture and live preview). */
  monthOverride?: string;
}) {
  const [params, setParams] = useSearchParams();
  const value = useMemo<ReportCtx>(() => {
    const months = sortMonths(report.months);
    const want = monthOverride ?? params.get('m') ?? '';
    let idx = months.findIndex((m) => monthKey(m.period) === want);
    if (idx < 0) idx = months.length - 1;
    const current = months[idx]!;
    const currentKey = monthKey(current.period);
    const latestKey = monthKey(months[months.length - 1]!.period);
    const query = currentKey === latestKey ? '' : `?m=${currentKey}`;
    return {
      report: { ...report, months },
      months,
      current,
      prev: idx > 0 ? months[idx - 1]! : null,
      history: months.slice(0, idx + 1),
      currentKey,
      setMonth: (key: string) =>
        setParams(
          (p) => {
            const n = new URLSearchParams(p);
            if (key === latestKey) n.delete('m');
            else n.set('m', key);
            return n;
          },
          { replace: true },
        ),
      basePath,
      href: (slug: string) => `${basePath}/${slug}${query}`,
      mode,
    };
  }, [report, params, setParams, basePath, mode, monthOverride]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Variant without router search params (for offscreen capture / PDF rendering). */
export function StaticReportProvider({ value, children }: { value: ReportCtx; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
