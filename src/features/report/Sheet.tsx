import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { AGENCY, SECTIONS, SHEET_H, SHEET_W, sectionBySlug, type SectionSlug } from '@/lib/constants';
import { monthLabel } from '@/lib/format';
import { DeltaBadge } from '@/components/ui';
import { useReport } from './ReportContext';

/** Gradient label in the style of the Word report's "Summary" / "Insights" chips. */
export function GradChip({ children, size = 'sm', className }: { children: ReactNode; size?: 'sm' | 'lg'; className?: string }) {
  return (
    <span
      className={cn(
        'bg-grad inline-flex items-center font-semibold leading-none text-black',
        size === 'lg' ? 'px-4 py-[9px] text-[20px]' : 'px-2.5 py-[5px] text-[12.5px]',
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A titled block inside a page. */
export function Panel({ title, aside, children, className, bodyClassName }: { title: string; aside?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn('flex min-w-0 flex-col', className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <GradChip>{title}</GradChip>
        {aside ? <div className="text-[11px] text-muted">{aside}</div> : null}
      </div>
      <div className={cn('min-w-0 flex-1', bodyClassName)}>{children}</div>
    </section>
  );
}

/** Compact KPI tile: light panel, label, big number, delta, gradient strip. */
export function KpiTile({ label, value, unit, delta, deltaUnit = '', note, className }: { label: string; value: ReactNode; unit?: string; delta?: number | null; deltaUnit?: string; note?: string; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col bg-panel', className)}>
      <div className="flex flex-1 flex-col gap-1.5 px-3.5 pb-3 pt-3">
        <div className="truncate text-[11px] font-medium text-ink-2">{label}</div>
        <div className="num text-[30px] font-bold leading-none tracking-[-0.02em] text-ink">
          {value}
          {unit ? <span className="ml-0.5 text-[15px] font-semibold text-muted">{unit}</span> : null}
        </div>
        <div className="flex items-center gap-2">
          {delta !== undefined ? <DeltaBadge value={delta} unit={deltaUnit} /> : null}
          {note ? <span className="truncate text-[10.5px] text-muted">{note}</span> : null}
        </div>
      </div>
      <div className="bg-grad h-[3px]" aria-hidden />
    </div>
  );
}

/** Bordered table with a gradient header row, like the Word report's tables. */
export function ReportTable({ head, rows, highlight, className, align }: { head: ReactNode[]; rows: ReactNode[][]; highlight?: (i: number) => boolean; className?: string; align?: Array<'left' | 'right' | 'center'> }) {
  const a = (i: number) => (align?.[i] === 'right' ? 'text-right' : align?.[i] === 'center' ? 'text-center' : 'text-left');
  return (
    <table className={cn('w-full border-collapse border border-ink text-[12px]', className)}>
      <thead>
        <tr className="bg-grad">
          {head.map((h, i) => (
            <th key={i} scope="col" className={cn('border-b border-ink px-2.5 py-[7px] text-[11.5px] font-bold text-black', a(i))}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri} className={cn('border-b border-ink last:border-b-0', highlight?.(ri) && 'bg-[#F3E8FF] font-semibold')}>
            {r.map((c, ci) => (
              <td key={ci} className={cn('px-2.5 py-[6px] align-middle text-ink', a(ci))}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * One report page at a fixed 960 x 1240 px (6.5in x 8.4in ratio), so a screenshot drops into a
 * Word page edge to edge. The page header carries the page title, client and month; the Word
 * document supplies the Rank Orbit logo header and page footer.
 */
export function Sheet({ section, children }: { section: SectionSlug; children: ReactNode }) {
  const { report, currentKey } = useReport();
  const meta = sectionBySlug(section);
  const n = SECTIONS.findIndex((s) => s.slug === section) + 1;
  return (
    <div className="sheet relative flex flex-col overflow-hidden bg-white text-ink" style={{ width: SHEET_W, height: SHEET_H, padding: '40px 44px 28px' }} data-sheet={section}>
      <header className="flex items-end justify-between gap-6 border-b-2 border-ink pb-4">
        <GradChip size="lg">{meta.title}</GradChip>
        <div className="min-w-0 text-right">
          <div className="truncate text-[16px] font-bold leading-tight">{report.client.name}</div>
          <div className="mt-1 text-[11.5px] text-ink-2">
            AI Optimization Report · <span className="font-semibold text-ink">{monthLabel(currentKey)}</span>
          </div>
        </div>
      </header>
      <main className="sheet-body flex min-h-0 flex-1 flex-col gap-[22px] pt-5">{children}</main>
      <footer className="mt-4 flex items-center justify-between border-t border-line pt-2.5 text-[10.5px] text-muted">
        <span>
          Prepared by {AGENCY} for {report.client.name}
        </span>
        <span>
          Page {n} of {SECTIONS.length}
        </span>
      </footer>
    </div>
  );
}
