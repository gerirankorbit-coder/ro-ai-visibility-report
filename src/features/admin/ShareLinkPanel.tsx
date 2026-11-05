import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, IndexTable, StatusChip, inputCls, useToast } from '@/components/ui';
import { createShareLink, listShareLinks, revokeShareLinks, shareUrl } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import type { ShareLink } from '@/types/schema';
import { FormGroup } from './BusinessInfoForm';

export function ShareLinkPanel({ clientId }: { clientId: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const key = ['links', clientId];
  const q = useQuery({ queryKey: key, queryFn: () => listShareLinks(clientId) });
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const active = q.data?.find((l) => !l.revoked_at) ?? null;
  const done = () => {
    void qc.invalidateQueries({ queryKey: key });
    void qc.invalidateQueries({ queryKey: ['clients'] });
  };
  const generate = useMutation({
    mutationFn: async () => {
      await revokeShareLinks(clientId);
      return createShareLink(clientId);
    },
    onSuccess: () => {
      done();
      toast('New share link created');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Could not create link'),
  });
  const revoke = useMutation({
    mutationFn: () => revokeShareLinks(clientId),
    onSuccess: () => {
      setConfirmRevoke(false);
      done();
      toast('Link revoked');
    },
  });
  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch {
      toast('Copy blocked. Select the link and copy it manually.');
    }
  };

  return (
    <div>
      <FormGroup title="Client share link" aside="Anyone with the link can view published months. Revoke it to cut access immediately.">
        {active ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 md:flex-row">
              <input readOnly aria-label="Share link" className={`${inputCls} t-mono flex-1`} value={shareUrl(active.token)} onFocus={(e) => e.currentTarget.select()} />
              <Button onClick={() => copy(shareUrl(active.token))} arrow="none">
                Copy link
              </Button>
              <a href={shareUrl(active.token)} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center px-2 text-[11px] underline underline-offset-4">
                Open ↗
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[12px] text-ink-2">
              <StatusChip tone="good">Active</StatusChip>
              <span>Created {fmtDate(active.created_at, true)}</span>
              <span>Last viewed {active.last_viewed_at ? fmtDate(active.last_viewed_at, true) : 'never'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <Button size="sm" variant="outline" arrow="none" onClick={() => generate.mutate()} disabled={generate.isPending}>
                Regenerate link
              </Button>
              {confirmRevoke ? (
                <>
                  <span className="text-[12px] text-bad">The client will see “This link is no longer active”.</span>
                  <Button size="sm" variant="danger" arrow="none" onClick={() => revoke.mutate()} disabled={revoke.isPending}>
                    Revoke
                  </Button>
                  <Button size="sm" variant="quiet" arrow="none" onClick={() => setConfirmRevoke(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="quiet" arrow="none" onClick={() => setConfirmRevoke(true)}>
                  Revoke link
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p className="text-ink-2">No active link. Generate one to share the report with the client.</p>
            <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
              {generate.isPending ? 'Generating…' : 'Generate share link'}
            </Button>
          </div>
        )}
      </FormGroup>
      {q.data && q.data.length > 0 ? (
        <FormGroup title="Link history">
          <IndexTable<ShareLink>
            caption="Share link history"
            minWidth={560}
            dense
            rows={q.data}
            rowKey={(r) => r.token}
            columns={[
              { key: 't', header: 'Token', render: (r) => <span className="t-mono text-[11.5px]">{r.token.slice(0, 8)}…</span> },
              { key: 'c', header: 'Created', render: (r) => <span className="t-mono text-[11.5px]">{fmtDate(r.created_at)}</span> },
              { key: 'v', header: 'Last viewed', render: (r) => <span className="t-mono text-[11.5px]">{fmtDate(r.last_viewed_at)}</span> },
              { key: 's', header: 'Status', render: (r) => (r.revoked_at ? <StatusChip tone="muted">Revoked {fmtDate(r.revoked_at)}</StatusChip> : <StatusChip tone="good">Active</StatusChip>) },
            ]}
          />
        </FormGroup>
      ) : null}
    </div>
  );
}
