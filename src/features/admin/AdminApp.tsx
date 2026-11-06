import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingPage } from '@/features/report/StatusPages';

const ClientList = lazy(() => import('./ClientList'));
const ClientEditor = lazy(() => import('./ClientEditor'));
const AdminPreview = lazy(() => import('./AdminPreview'));
const AdminFullReport = lazy(() => import('./AdminFullReport'));
const NotesPage = lazy(() => import('./NotesPage'));

/** Access control happens on the server (password gate); reaching this code means the session is valid. */
export default function AdminApp() {
  useEffect(() => {
    document.title = 'Rank Orbit · Admin';
  }, []);
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        <Route path="" element={<ClientList />} />
        <Route path="clients/:id" element={<ClientEditor />} />
        <Route path="clients/:id/preview/:section?" element={<AdminPreview />} />
        <Route path="clients/:id/report" element={<AdminFullReport />} />
        <Route path="updates" element={<NotesPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  );
}
