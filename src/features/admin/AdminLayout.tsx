import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AgencyMark } from '@/components/ui';
import { signOut } from '@/lib/api';

export function AdminLayout({ children, crumbs }: { children: ReactNode; crumbs?: ReactNode }) {
  return (
    <div className="admin min-h-screen bg-paper text-[13px]">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/[0.92] backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-[1600px] items-center justify-between gap-4 px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2.5 text-[12px] font-medium">
              <AgencyMark size={16} />
              <span className="font-display">Rank Orbit</span>
              <span className="t-meta text-muted">Admin</span>
            </Link>
            {crumbs ? (
              <>
                <span className="h-3 w-px bg-line" />
                <div className="min-w-0 truncate text-[12px] text-ink-2">{crumbs}</div>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-5 text-[11px]">
            <Link to="/admin" className="text-ink-2 hover:text-ink">
              Clients
            </Link>
            <Link to="/admin/updates" className="text-ink-2 hover:text-ink">
              Google updates
            </Link>
            <Link to="/demo/summit/full" className="text-ink-2 hover:text-ink">
              Demo
            </Link>
            <span className="t-meta hidden items-center gap-1.5 text-muted md:inline-flex">
              <span className="inline-block h-[6px] w-[6px] bg-good" aria-hidden />
              Private session
            </span>
            <button type="button" className="text-ink underline underline-offset-4" onClick={() => void signOut()}>
              Lock
            </button>
          </div>
        </div>
      </header>
      <main className="@container mx-auto max-w-[1600px] px-5 pb-24 md:px-8">{children}</main>
    </div>
  );
}
