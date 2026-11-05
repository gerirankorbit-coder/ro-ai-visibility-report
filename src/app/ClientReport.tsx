import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { fetchReport } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { ReportProvider } from '@/features/report/ReportContext';
import { ReportShell } from '@/features/report/ReportShell';
import { FirstReportPreparing, LinkInactive, LoadingPage, MessagePage } from '@/features/report/StatusPages';

export default function ClientReport() {
  const { token = '' } = useParams();
  const valid = /^[A-Za-z0-9_-]{16,128}$/.test(token);
  const q = useQuery({
    queryKey: ['report', token],
    queryFn: () => fetchReport(token),
    enabled: valid && supabaseConfigured,
    staleTime: 5 * 60_000,
  });
  if (!supabaseConfigured) return <MessagePage eyebrow="Configuration" title="Reports are not connected yet" rest="This deployment has no database configured." />;
  if (!valid) return <LinkInactive />;
  if (q.isPending) return <LoadingPage />;
  if (q.isError) return <MessagePage eyebrow="Report" title="We could not load this report" rest="Please refresh the page in a moment. If the problem continues, contact your account manager." />;
  const report = q.data;
  if (!report) return <LinkInactive />;
  if (!report.months.length) return <FirstReportPreparing clientName={report.client.name} />;
  return (
    <ReportProvider report={report} basePath={`/r/${token}`} mode="client">
      <ReportShell />
    </ReportProvider>
  );
}
