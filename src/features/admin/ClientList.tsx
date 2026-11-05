import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button, IndexTable, StatusChip, TextLink, useToast } from '@/components/ui';
import { createClientRow, listClients, type ClientListRow } from '@/lib/api';
import { newClientInput } from '@/lib/defaults';
import { monthKey, monthLabel } from '@/lib/format';
import { aiReadiness } from '@/lib/metrics';
import { AdminLayout } from './AdminLayout';

export default function ClientList() {
  const q = useQuery({ queryKey: ['clients'], queryFn: listClients });
  const qc = useQueryClient();
  const nav = useNavigate();
  const toast = useToast();
  const create = useMutation({
    mutationFn: () => createClientRow(newClientInput()),
    onSuccess: (c) => {
      void qc.invalidateQueries({ queryKey: ['clients'] });
      nav(`/admin/clients/${c.id}`);
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Could not create client'),
  });

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 pb-10 pt-12 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[56px] font-medium leading-[0.92] tracking-[-0.055em]">Clients</h1>
          <p className="t-meta mt-3 text-muted">{q.data ? `${q.data.length} client${q.data.length === 1 ? '' : 's'}` : 'Loading…'} · AI Search Visibility Program</p>
        </div>
        <Button onClick={() => create.mutate()} disabled={create.isPending} arrow="right">
          {create.isPending ? 'Creating…' : 'New client'}
        </Button>
      </div>
      {q.isError ? (
        <p className="border-t border-line py-10 text-bad">
          {(q.error as Error).message === 'database_not_configured'
            ? 'The database is not connected. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server (see README).'
            : `Could not load clients: ${(q.error as Error).message}`}
        </p>
      ) : null}
      {q.data && q.data.length === 0 ? <p className="border-t border-line py-10 text-muted">No clients yet. Create the first one.</p> : null}
      {q.data && q.data.length > 0 ? (
        <IndexTable<ClientListRow>
          caption="Clients"
          minWidth={820}
          rows={q.data}
          rowKey={(r) => r.client.id}
          onRowClick={(r) => nav(`/admin/clients/${r.client.id}`)}
          columns={[
            { key: 'c', header: 'Client', render: (r) => <span className="text-[13px] font-medium">{r.client.name}</span> },
            { key: 'cat', header: 'Category', render: (r) => <span className="text-ink-2">{r.client.category || '—'}</span> },
            {
              key: 'm',
              header: 'Latest month',
              render: (r) =>
                r.latest ? (
                  <span className="inline-flex items-center gap-3">
                    <span className="t-mono">{monthLabel(monthKey(r.latest.period), 'shortYear')}</span>
                    {r.latest.published ? <StatusChip tone="good">Published</StatusChip> : <StatusChip tone="muted">Draft</StatusChip>}
                  </span>
                ) : (
                  <span className="text-muted">No data</span>
                ),
            },
            { key: 'ai', header: 'AI Readiness', render: (r) => <span className="t-mono">{r.latest ? aiReadiness(r.latest) : '—'}</span> },
            {
              key: 'o',
              header: <span className="sr-only">Open</span>,
              align: 'right',
              className: 'pr-0',
              render: (r) => (
                <TextLink to={`/admin/clients/${r.client.id}`} arrow="right" onClick={(e) => e.stopPropagation()}>
                  Open
                </TextLink>
              ),
            },
          ]}
        />
      ) : null}
    </AdminLayout>
  );
}
