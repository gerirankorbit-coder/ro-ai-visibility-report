import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { LoadingPage, MessagePage } from '@/features/report/StatusPages';
import { TextLink } from '@/components/ui';
import { AuthProvider, useAuth } from './auth';
import { LoginPage } from './LoginPage';

const ClientList = lazy(() => import('./ClientList'));
const ClientEditor = lazy(() => import('./ClientEditor'));
const AdminPreview = lazy(() => import('./AdminPreview'));

function Guard({ children }: { children: ReactNode }) {
  const { loading, session, staff } = useAuth();
  const loc = useLocation();
  if (loading) return <LoadingPage />;
  if (!session) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;
  if (!staff)
    return (
      <MessagePage eyebrow="Admin" title="No staff access" rest="You are signed in, but this account is not on the staff list. Ask an owner to add your user id to the staff table.">
        <button type="button" className="text-[11px] underline underline-offset-4" onClick={() => supabase?.auth.signOut()}>
          Sign out
        </button>
      </MessagePage>
    );
  return <>{children}</>;
}

export default function AdminApp() {
  useEffect(() => {
    document.title = 'Rank Orbit · Admin';
  }, []);
  if (!supabaseConfigured)
    return (
      <MessagePage eyebrow="Admin" title="Connect Supabase to use the Admin" rest="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then reload. See the README for setup.">
        <TextLink to="/demo">View the demo report</TextLink>
      </MessagePage>
    );
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route path="" element={<Guard><ClientList /></Guard>} />
          <Route path="clients/:id" element={<Guard><ClientEditor /></Guard>} />
          <Route path="clients/:id/preview/:section?" element={<Guard><AdminPreview /></Guard>} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
