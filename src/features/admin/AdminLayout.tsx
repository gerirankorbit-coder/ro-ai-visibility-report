import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AgencyMark } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth';

export function AdminLayout({ children, crumbs }: { children: ReactNode; crumbs?: ReactNode }) {
  const { session } = useAuth();
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
            <Link to="/demo" className="text-ink-2 hover:text-ink">
              Demo
            </Link>
            {session ? <span className="t-mono hidden text-muted md:inline">{session.user.email}</span> : null}
            <button type="button" className="text-ink underline underline-offset-4" onClick={() => supabase?.auth.signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="@container mx-auto max-w-[1600px] px-5 pb-24 md:px-8">{children}</main>
    </div>
  );
}

