import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { AGENCY, type SectionSlug, sectionBySlug } from '@/lib/constants';
import { monthKey, monthLabel, sinceLabel } from '@/lib/format';
import { AgencyMark, SectionLabel } from '@/components/ui';
import { useReport } from './ReportContext';

/** Full-bleed band; inner content sits on the shared grid. */
export function Band({ tone = 'light', children, className, id, tight = false }: { tone?: 'light' | 'dark'; children: ReactNode; className?: string; id?: string; tight?: boolean }) {
  return (
    <section id={id} className={cn(tone === 'dark' ? 'on-dark bg-black text-white' : 'bg-paper text-ink', className)}>
      <div className={cn('shell', tight ? 'py-12 @lg:py-16' : 'band-y')}>{children}</div>
    </section>
  );
}

/** Section block heading: red-square label left, optional description and aside. */
export function BlockHead({ label, title, description, aside, tone = 'light', className, id, stacked = false }: { label: string; title?: ReactNode; description?: ReactNode; aside?: ReactNode; tone?: 'light' | 'dark'; className?: string; id?: string; stacked?: boolean }) {
  const dark = tone === 'dark';
  if (stacked) {
    return (
      <div className={cn('mb-8 border-t pt-5', dark ? 'border-line-d' : 'border-line', className)}>
        <SectionLabel tone={tone} id={id}>
          {label}
        </SectionLabel>
      </div>
    );
  }
  return (
    <div className={cn('mb-10 grid grid-cols-1 gap-4 border-t pt-5 @lg:grid-cols-12 @lg:gap-6', dark ? 'border-line-d' : 'border-line', className)}>
      <div className="@lg:col-span-3">
        <SectionLabel tone={tone} id={id}>
          {label}
        </SectionLabel>
      </div>
      <div className="flex flex-col gap-2 @lg:col-span-6">
        {title ? <h3 className={cn('t-h2', dark ? 'text-white' : 'text-ink')}>{title}</h3> : null}
        {description ? <p className={cn('max-w-[56ch] text-small', dark ? 'text-muted-d' : 'text-muted')}>{description}</p> : null}
      </div>
      {aside ? <div className="flex items-start @lg:col-span-3 @lg:justify-end">{aside}</div> : null}
    </div>
  );
}

export function ReportHeader() {
  const { report } = useReport();
  const c = report.client;
  const since = sinceLabel(c.client_since);
  return (
    <header className="bg-paper">
      <div className="shell pb-10 pt-12 @lg:pb-12 @lg:pt-16">
        <h1 className="t-display-xl max-w-[16ch] text-ink">{c.name}</h1>
        <div className="mt-10 grid grid-cols-1 gap-6 @md:grid-cols-12 @md:items-end">
          <div className="@md:col-span-7">
            {c.category ? <p className="font-display text-[20px] font-medium leading-tight tracking-[-0.02em] text-ink @md:text-[24px]">{c.category}</p> : null}
            <p className="t-meta mt-2 text-muted">
              AI Search Visibility Program{since ? ` · Client since ${since}` : ''}
            </p>
          </div>
          <address className="t-meta not-italic text-ink-2 @md:col-span-5 @md:text-right">
            {c.address ? <div>{c.address}</div> : null}
            {c.locality ? <div>{c.locality}</div> : null}
            {c.phone ? <div className="num">{c.phone}</div> : null}
            {c.website ? <div>{c.website}</div> : null}
          </address>
        </div>
      </div>
      <div className="shell">
        <div className="h-px bg-line" />
      </div>
    </header>
  );
}

export function ReportFooter() {
  const { report, currentKey } = useReport();
  return (
    <footer className="bg-paper">
      <div className="shell">
        <div className="flex flex-col gap-2 border-t border-line py-6 @md:flex-row @md:items-center @md:justify-between">
          <p className="t-meta text-muted">
            Prepared by {AGENCY} for {report.client.name}
          </p>
          <p className="t-meta text-muted">Report period: {monthLabel(currentKey)}</p>
        </div>
      </div>
    </footer>
  );
}

/** Slim header shown only inside exported screenshots. */
export function CaptureHeader({ section }: { section: SectionSlug }) {
  const { report, current } = useReport();
  return (
    <div className="capture-only bg-paper">
      <div className="shell flex h-14 w-full items-center justify-between border-b border-line">
        <div className="flex items-center gap-3">
          <AgencyMark size={16} />
          <span className="text-[11px] font-medium">{AGENCY}</span>
          <span className="h-3 w-px bg-line" />
          <span className="text-[11px] text-ink-2">{sectionBySlug(section).title}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-ink-2">{report.client.name}</span>
          <span className="h-3 w-px bg-line" />
          <span className="t-mono text-ink">{monthLabel(monthKey(current.period))}</span>
        </div>
      </div>
    </div>
  );
}
