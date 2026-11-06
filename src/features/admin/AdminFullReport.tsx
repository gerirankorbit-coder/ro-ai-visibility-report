import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getClient, getNote, listMonths, logoDataUrl } from '@/lib/api';
import { monthKey, monthLabel } from '@/lib/format';
import { ReportProvider, useReport } from '@/features/report/ReportContext';
import { LoadingPage, MessagePage } from '@/features/report/StatusPages';
import { FullReportView } from '@/features/fullreport/FullReportView';
import { TextLink } from '@/components/ui';

function Inner({ id }: { id: string }) {
  const { current, months, currentKey, setMonth } = useReport();
  const note = useQuery({ queryKey: ['note', current.period], queryFn: () => getNote(current.period), staleTime: 0 });
  if (note.isPending) return <LoadingPage />;
  return (
    <FullReportView
      note={note.data ?? null}
      toolbarExtra={
        <>
          <Link to={`/admin/clients/${id}?tab=months`} className="text-[12px] underline underline-offset-4">
            Back to editor
          </Link>
          <select value={currentKey} onChange={(e) => setMonth(e.target.value)} className="h-8 border border-line bg-white px-2 text-[12px] font-semibold" aria-label="Month">
            {months
              .slice()
              .reverse()
              .map((m) => (
                <option key={m.id} value={monthKey(m.period)}>
                  {monthLabel(monthKey(m.period))}
                  {m.published ? '' : ' (draft)'}
                </option>
              ))}
          </select>
        </>
      }
    />
  );
}

/** Full GMB + AI report for one client and month, with PDF export. */
export default function AdminFullReport() {
  const { id = '' } = useParams();
  const client = useQuery({ queryKey: ['client', id], queryFn: () => getClient(id), staleTime: 0 });
  const months = useQuery({ queryKey: ['months', id], queryFn: () => listMonths(id), staleTime: 0 });
  const logo = useQuery({ queryKey: ['logo', client.data?.logo_path ?? null], queryFn: () => logoDataUrl(client.data?.logo_path ?? null), enabled: client.isSuccess });
  const report = useMemo(() => (client.data && months.data ? { client: { ...client.data, logo_url: logo.data ?? null }, months: months.data } : null), [client.data, months.data, logo.data]);
  if (client.isPending || months.isPending) return <LoadingPage />;
  if (client.isError || months.isError) return <MessagePage eyebrow="Report" title="Could not load report" rest={((client.error ?? months.error) as Error).message} />;
  if (!report || !report.months.length)
    return (
      <MessagePage eyebrow={client.data.name} title="No months yet" rest="Add a month in Monthly data first.">
        <TextLink to={`/admin/clients/${id}?tab=months`} arrow="right">
          Go to Monthly data
        </TextLink>
      </MessagePage>
    );
  return (
    <div className="min-h-screen bg-canvas">
      <ReportProvider report={report} basePath={`/admin/clients/${id}/preview`} mode="preview">
        <Inner id={id} />
      </ReportProvider>
    </div>
  );
}
