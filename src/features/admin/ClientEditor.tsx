import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BlockTabs, Button, ButtonLink, useToast } from '@/components/ui';
import { deleteClientRow, getClient, listMonths } from '@/lib/api';
import { ReportProvider } from '@/features/report/ReportContext';
import { LoadingPage } from '@/features/report/StatusPages';
import { AdminLayout } from './AdminLayout';
import { BusinessInfoForm } from './BusinessInfoForm';
import { ExportPdfButton } from './ExportPdfButton';
import { MonthEditor } from './MonthEditor';
import { ShareLinkPanel } from './ShareLinkPanel';

type Tab = 'info' | 'months' | 'share';

export default function ClientEditor() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (['info', 'months', 'share'].includes(params.get('tab') ?? '') ? params.get('tab') : 'months') as Tab;
  const client = useQuery({ queryKey: ['client', id], queryFn: () => getClient(id) });
  const months = useQuery({ queryKey: ['months', id], queryFn: () => listMonths(id) });
  const qc = useQueryClient();
  const nav = useNavigate();
  const toast = useToast();
  const [confirmDel, setConfirmDel] = useState(false);
  const del = useMutation({
    mutationFn: () => deleteClientRow(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['clients'] });
      toast('Client deleted');
      nav('/admin');
    },
  });

  if (client.isPending || months.isPending) return <LoadingPage />;
  if (client.isError || months.isError)
    return (
      <AdminLayout>
        <p className="py-16 text-bad">Could not load this client. {((client.error ?? months.error) as Error)?.message}</p>
        <Link to="/admin" className="underline">
          Back to clients
        </Link>
      </AdminLayout>
    );

  const c = client.data;
  const ms = months.data;

  return (
    <AdminLayout crumbs={c.name}>
      <div className="flex flex-col gap-6 pb-8 pt-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link to="/admin" className="t-meta text-muted hover:text-ink">
            ← All clients
          </Link>
          <h1 className="font-display mt-3 truncate text-[48px] font-medium leading-[0.95] tracking-[-0.05em]">{c.name}</h1>
          <p className="t-meta mt-2 text-muted">
            {c.category || 'No category'} · {ms.length} month{ms.length === 1 ? '' : 's'} · {ms.filter((m) => m.published).length} published
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {ms.length ? (
            <ReportProvider report={{ client: { ...c, logo_url: null }, months: ms }} basePath={`/admin/clients/${id}/preview`} mode="preview">
              <ExportPdfButton />
            </ReportProvider>
          ) : null}
          <ButtonLink to={`/admin/clients/${id}/preview`} size="sm" arrow="up-right">
            Preview client view
          </ButtonLink>
        </div>
      </div>
      <BlockTabs
        label="Client editor"
        idBase="editor"
        value={tab}
        onChange={(v) => setParams({ tab: v }, { replace: true })}
        items={[
          { value: 'info', title: 'Business info', description: 'Name, address, services, logo, hours' },
          { value: 'months', title: 'Monthly data', description: 'Metrics, listings, work, community' },
          { value: 'share', title: 'Share link', description: 'Private client link and access' },
        ]}
      />
      <div role="tabpanel" id="editor-panel" aria-labelledby={`editor-tab-${tab}`} className="pt-2">
        {tab === 'info' ? (
          <>
            <BusinessInfoForm key={c.id} client={c} />
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-8">
              {confirmDel ? (
                <>
                  <span className="text-[12px] text-bad">Delete {c.name} and all of its months and links?</span>
                  <Button size="sm" variant="danger" arrow="none" onClick={() => del.mutate()} disabled={del.isPending}>
                    Delete client
                  </Button>
                  <Button size="sm" variant="quiet" arrow="none" onClick={() => setConfirmDel(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="quiet" arrow="none" onClick={() => setConfirmDel(true)}>
                  Delete client…
                </Button>
              )}
            </div>
          </>
        ) : tab === 'months' ? (
          <MonthEditor key={c.id} client={c} months={ms} />
        ) : (
          <ShareLinkPanel clientId={c.id} />
        )}
      </div>
    </AdminLayout>
  );
}
