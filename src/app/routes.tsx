import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoadingPage, MessagePage } from '@/features/report/StatusPages';
import { TextLink } from '@/components/ui';

const DemoReport = lazy(() => import('./DemoReport'));
const ClientReport = lazy(() => import('./ClientReport'));
const Styleguide = lazy(() => import('./styleguide/Styleguide'));
const StyleguideCharts = lazy(() => import('./styleguide/StyleguideCharts'));
const AdminApp = lazy(() => import('@/features/admin/AdminApp'));

const s = (el: ReactNode) => <Suspense fallback={<LoadingPage />}>{el}</Suspense>;

function NotFound() {
  return (
    <MessagePage eyebrow="404" title="Page not found" rest="The page you are looking for does not exist.">
      <TextLink to="/demo">View the demo report</TextLink>
    </MessagePage>
  );
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/admin" replace /> },
  { path: '/demo', element: <Navigate to="/demo/summit/overview" replace /> },
  { path: '/demo/:client/:section?', element: s(<DemoReport />) },
  { path: '/r/:token/:section?', element: s(<ClientReport />) },
  { path: '/styleguide', element: s(<Styleguide />) },
  { path: '/styleguide/charts', element: s(<StyleguideCharts />) },
  { path: '/admin/*', element: s(<AdminApp />) },
  { path: '*', element: <NotFound /> },
], { future: { v7_relativeSplatPath: true, v7_fetcherPersist: true, v7_normalizeFormMethod: true, v7_partialHydration: true, v7_skipActionErrorRevalidation: true } });
