import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getClient, listMonths, logoDataUrl } from '@/lib/api';
import { ReportProvider } from '@/features/report/ReportContext';
import { ReportShell } from '@/features/report/ReportShell';
import { LoadingPage, MessagePage } from '@/features/report/StatusPages';
import { TextLink } from '@/components/ui';
import { ExportPdfButton } from './ExportPdfButton';

function PreviewBanner({ id }: { id: string }) {
  return (
    <div className="no-capture border-b border-line-d bg-black text-white">
      <div className="mx-auto flex h-10 max-w-content items-center justify-between gap-4 px-5 md:px-12">
        <p className="t-meta text-muted-d">
          Staff preview · includes draft months ·{' '}
          <Link to={`/admin/clients/${id}?tab=months`} className="text-white underline underline-offset-4">
            Back to editor
          </Link>
        </p>
        <div className="[&_button>span]:!border-line-d [&_button>span]:!text-white">
          <ExportPdfButton />
        </div>
      </div>
    </div>
  );
}

export default function AdminPreview() {
  const { id = '' } = useParams();
  // Same query keys as the editor, so edits made there show up here immediately.
  const client = useQuery({ queryKey: ['client', id], queryFn: () => getClient(id), staleTime: 0 });
  const months = useQuery({ queryKey: ['months', id], queryFn: () => listMonths(id), staleTime: 0 });
  const logo = useQuery({
    queryKey: ['logo', client.data?.logo_path ?? null],
    queryFn: () => logoDataUrl(client.data?.logo_path ?? null),
    enabled: client.isSuccess,
    staleTime: 10 * 60_000,
  });
  const report = useMemo(
    () => (client.data && months.data ? { client: { ...client.data, logo_url: logo.data ?? null }, months: months.data } : null),
    [client.data, months.data, logo.data],
  );
  if (client.isPending || months.isPending) return <LoadingPage />;
  if (client.isError || months.isError)
    return <MessagePage eyebrow="Preview" title="Could not load preview" rest={((client.error ?? months.error) as Error).message} />;
  if (!report || !report.months.length)
    return (
      <MessagePage eyebrow={client.data.name} title="No months yet" rest="Add the first month in Monthly data. Draft months show in this preview; publish a month when it is ready for the client.">
        <TextLink to={`/admin/clients/${id}?tab=months`} arrow="right">
          Go to Monthly data
        </TextLink>
      </MessagePage>
    );
  return (
    <ReportProvider report={report} basePath={`/admin/clients/${id}/preview`} mode="preview">
      <ReportShell banner={<PreviewBanner id={id} />} />
    </ReportProvider>
  );
}
