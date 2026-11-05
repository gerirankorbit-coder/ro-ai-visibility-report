import type { ReactNode } from 'react';
import { AgencyMark, RedSquare } from '@/components/ui';
import { AGENCY } from '@/lib/constants';

/** Full-page message in the report design language (empty, revoked, error, loading). */
export function MessagePage({ eyebrow, title, rest, children }: { eyebrow: string; title: string; rest?: string; children?: ReactNode }) {
  return (
    <div className="@container flex min-h-screen flex-col bg-paper">
      <header className="border-b border-line">
        <div className="shell flex h-12 items-center gap-2.5">
          <AgencyMark size={16} />
          <span className="font-display text-[12px] font-medium">{AGENCY}</span>
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <div className="shell flex flex-1 flex-col justify-center py-24">
          <div className="t-meta mb-8 flex items-center gap-2 text-ink">
            <RedSquare />
            {eyebrow}
          </div>
          <h1 className="t-display-xl max-w-[14ch] text-ink">{title}</h1>
          {rest ? <p className="t-statement mt-10 max-w-[36ch] text-ghost">{rest}</p> : null}
          {children ? <div className="mt-10">{children}</div> : null}
        </div>
      </main>
      <footer className="border-t border-line">
        <div className="shell flex h-14 items-center">
          <p className="t-meta text-muted">AI Search Visibility Program by {AGENCY}</p>
        </div>
      </footer>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="inline-block h-[6px] w-[6px] animate-pulse bg-accent" />
        <span className="t-meta text-muted">Loading report…</span>
      </div>
    </div>
  );
}

export function FirstReportPreparing({ clientName }: { clientName: string }) {
  return <MessagePage eyebrow={clientName} title="Your first report is being prepared" rest="We are completing the baseline audit of your listings, entity signals and AI engine presence. Publish a month to see the first report here." />;
}
