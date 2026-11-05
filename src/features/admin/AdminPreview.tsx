import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getClient, listMonths, logoDataUrl } from '@/lib/api';
import { ReportProvider } from '@/features/report/ReportContext';
import { ReportShell } from '@/features/report/ReportShell';
import { FirstReportPreparing, LoadingPage, MessagePage } from '@/features/report/StatusPages';
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
  const q = useQuery({
    queryKey: ['preview', id],
    queryFn: async () => {
      const [client, months] = await Promise.all([getClient(id), listMonths(id)]);
      return { client: { ...client, logo_url: await logoDataUrl(client.logo_path) }, months };
    },
  });
  if (q.isPending) return <LoadingPage />;
  if (q.isError) return <MessagePage eyebrow="Preview" title="Could not load preview" rest={(q.error as Error).message} />;
  if (!q.data.months.length) return <FirstReportPreparing clientName={q.data.client.name} />;
  return (
    <ReportProvider report={q.data} basePath={`/admin/clients/${id}/preview`} mode="preview">
      <ReportShell banner={<PreviewBanner id={id} />} />
    </ReportProvider>
  );
}
