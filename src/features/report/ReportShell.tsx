import type { ReactNode } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { AgencyMark, Caret } from '@/components/ui';
import { AGENCY, SECTIONS, sectionBySlug, type SectionSlug } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { monthKey, monthLabel } from '@/lib/format';
import { useReport } from './ReportContext';
import { ReportDocument } from './ReportDocument';
import { ScreenshotButton } from './ScreenshotButton';
import { useEffect } from 'react';

function MonthSwitcher() {
  const { months, currentKey, setMonth, mode } = useReport();
  return (
    <label className="relative inline-flex items-center gap-1.5 text-[11px]">
      <span className="sr-only">Report month</span>
      <select
        value={currentKey}
        onChange={(e) => setMonth(e.target.value)}
        className="t-mono h-8 cursor-pointer appearance-none bg-transparent pr-4 text-[11px] text-ink hover:underline focus-visible:outline-red"
      >
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
      <Caret className="pointer-events-none absolute right-0" />
    </label>
  );
}

function TopNav({ section }: { section: SectionSlug }) {
  const { href } = useReport();
  const links = (
    <>
      {SECTIONS.map((s) => (
        <NavLink
          key={s.slug}
          to={href(s.slug)}
          aria-current={s.slug === section ? 'page' : undefined}
          className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] leading-none', s.slug === section ? 'text-ink' : 'text-ink-2 hover:text-ink')}
        >
          {s.slug === section ? <span aria-hidden className="inline-block h-1 w-1 rounded-full bg-red" /> : null}
          {s.nav}
          <Caret size={7} className="opacity-50" />
        </NavLink>
      ))}
    </>
  );
  return (
    <header className="no-capture sticky top-0 z-40 border-b border-line bg-paper/[0.92] backdrop-blur-md">
      <div className="mx-auto flex h-12 w-full max-w-content items-center justify-between gap-4 px-5 md:px-12">
        <Link to={href('overview')} className="flex items-center gap-2.5 text-[12px] font-medium text-ink" aria-label={`${AGENCY} report home`}>
          <AgencyMark size={16} />
          <span className="font-display tracking-[-0.01em]">{AGENCY}</span>
        </Link>
        <nav aria-label="Report sections" className="hidden items-center gap-6 lg:flex">
          {links}
        </nav>
        <div className="flex items-center gap-4">
          <MonthSwitcher />
          <ScreenshotButton section={section} />
        </div>
      </div>
      <nav aria-label="Report sections" className="flex items-center gap-5 overflow-x-auto border-t border-line px-5 md:px-12 lg:hidden">
        {links}
      </nav>
    </header>
  );
}

/** Report page: sticky TopNav + the capturable report document. */
export function ReportShell({ banner }: { banner?: ReactNode }) {
  const { section: raw } = useParams();
  const section = sectionBySlug(raw).slug;
  const { report, currentKey } = useReport();
  useEffect(() => {
    document.title = `${sectionBySlug(section).title} · ${report.client.name} · ${monthLabel(currentKey)}`;
  }, [section, report.client.name, currentKey]);
  return (
    <div className="min-h-screen bg-paper">
      {banner}
      <TopNav section={section} />
      <main>
        <ReportDocument id="report-capture" section={section} />
      </main>
    </div>
  );
}
