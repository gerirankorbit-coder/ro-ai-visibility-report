import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { AgencyMark, Caret } from '@/components/ui';
import { AGENCY, SECTIONS, SHEET_H, SHEET_W, sectionBySlug, type SectionSlug } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { monthKey, monthLabel } from '@/lib/format';
import { useReport } from './ReportContext';
import { ReportDocument } from './ReportDocument';
import { ExportBar } from './ExportBar';

function MonthSwitcher() {
  const { months, currentKey, setMonth, mode } = useReport();
  return (
    <label className="relative inline-flex items-center gap-2 text-[12px]">
      <span className="text-muted">Month</span>
      <select value={currentKey} onChange={(e) => setMonth(e.target.value)} className="h-8 cursor-pointer appearance-none border border-line bg-white pl-2.5 pr-7 text-[12px] font-semibold text-ink focus-visible:outline-accent">
        {months
          .slice()
          .reverse()
          .map((m) => {
            const k = monthKey(m.period);
            return (
              <option key={k} value={k}>
                {monthLabel(k)}
                {mode === 'preview' && !m.published ? ' (draft)' : ''}
              </option>
            );
          })}
      </select>
      <Caret className="pointer-events-none absolute right-2.5" />
    </label>
  );
}

/** Shows the fixed-size page, scaled down to fit narrow screens (exports are never scaled). */
function PageViewer({ section }: { section: SectionSlug }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / SHEET_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="mx-auto w-full max-w-[960px]">
      <div style={{ height: SHEET_H * scale }}>
        <div className="border border-line" style={{ width: SHEET_W, transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: '0 0' }}>
          <ReportDocument id="report-capture" section={section} />
        </div>
      </div>
    </div>
  );
}

/** Report workspace: page tabs, month switcher and exports above the current page. */
export function ReportShell({ banner }: { banner?: ReactNode }) {
  const { section: raw } = useParams();
  const section = sectionBySlug(raw).slug;
  const { report, currentKey, href } = useReport();
  useEffect(() => {
    document.title = `${sectionBySlug(section).title} · ${report.client.name} · ${monthLabel(currentKey)}`;
  }, [section, report.client.name, currentKey]);
  return (
    <div className="min-h-screen bg-canvas">
      {banner}
      <header className="no-capture sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex min-h-12 max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-2">
          <div className="flex items-center gap-2.5 text-[13px] font-bold">
            <AgencyMark size={16} color="#B227FF" />
            {AGENCY}
            <span className="font-normal text-muted">· {report.client.name}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <MonthSwitcher />
            <ExportBar section={section} />
          </div>
        </div>
        <nav aria-label="Report pages" className="mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-5">
          {SECTIONS.map((s, i) => (
            <NavLink
              key={s.slug}
              to={href(s.slug)}
              aria-current={s.slug === section ? 'page' : undefined}
              className={cn('relative inline-flex h-10 shrink-0 items-center gap-2 px-3 text-[12.5px] font-semibold', s.slug === section ? 'text-ink' : 'text-muted hover:text-ink')}
            >
              <span className={cn('inline-flex h-5 w-5 items-center justify-center text-[11px]', s.slug === section ? 'bg-grad text-black' : 'bg-panel')}>{i + 1}</span>
              {s.title}
              {s.slug === section ? <span className="bg-grad absolute inset-x-0 bottom-0 h-[3px]" aria-hidden /> : null}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="px-4 py-8">
        <PageViewer section={section} />
        <p className="no-capture mx-auto mt-4 max-w-[960px] text-center text-[11.5px] text-muted">
          Each page is sized to fit one Word page (6.5in wide). Use <b>Copy page</b> and paste into your report, or download PNG / PDF.
        </p>
      </main>
    </div>
  );
}
