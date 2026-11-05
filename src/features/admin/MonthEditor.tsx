import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Close, IconButton, NumberInput, SelectInput, Slider, TextArea, Toggle, inputCls, useToast } from '@/components/ui';
import { createMonth, deleteMonth, updateMonth } from '@/lib/api';
import { ENGINES, ENTITY, NAP_FIELDS, PHASES, STATUS_LABEL, WORK } from '@/lib/constants';
import { emptyMonthInput, monthToInput } from '@/lib/defaults';
import { monthKey, monthLabel, nextMonthKey } from '@/lib/format';
import { aiReadiness, consistentListings, monthWarnings } from '@/lib/metrics';
import { SOURCE_STATUSES, type Client, type Forum, type Month, type SourceStatus } from '@/types/schema';
import { FormGroup } from './BusinessInfoForm';
import { LivePreview } from './LivePreview';
import { SaveStatus } from './SaveStatus';
import { useAutosave } from './useAutosave';

export function MonthEditor({ client, months }: { client: Client; months: Month[] }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(months[months.length - 1]?.id ?? null);
  const serverMonth = months.find((m) => m.id === selectedId) ?? months[months.length - 1] ?? null;
  const [draft, setDraft] = useState<Month | null>(serverMonth);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Re-baseline the draft only when switching months.
  useEffect(() => {
    setDraft(serverMonth);
    setConfirmDelete(false);
  }, [serverMonth?.id]);

  const key = ['months', client.id];
  const replaceInCache = (m: Month) => qc.setQueryData<Month[]>(key, (old) => (old ?? []).map((x) => (x.id === m.id ? m : x)));

  const save = useAutosave(
    draft,
    async (v) => {
      if (!v) return;
      const saved = await updateMonth(v.id, monthToInput(v));
      replaceInCache(saved);
      void qc.invalidateQueries({ queryKey: ['clients'] });
    },
    { resetKey: draft?.id ?? 'none' },
  );

  const add = useMutation({
    mutationFn: async () => {
      const latest = months[months.length - 1];
      if (!latest) {
        const now = new Date();
        return createMonth(client.id, emptyMonthInput(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`));
      }
      return createMonth(client.id, { ...monthToInput(latest), period: `${nextMonthKey(monthKey(latest.period))}-01`, published: false, note: '' });
    },
    onSuccess: async (m) => {
      await qc.invalidateQueries({ queryKey: key });
      setSelectedId(m.id);
      toast(`Added ${monthLabel(monthKey(m.period))}`);
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Could not add month'),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteMonth(id),
    onSuccess: async () => {
      setSelectedId(null);
      await qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: ['clients'] });
      toast('Month deleted');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Could not delete month'),
  });

  const previewMonths = useMemo(() => (draft ? months.map((m) => (m.id === draft.id ? draft : m)) : months), [months, draft]);

  if (!draft) {
    return (
      <div className="border-t border-line py-16">
        <p className="mb-6 text-ink-2">No months yet for this client.</p>
        <Button onClick={() => add.mutate()} disabled={add.isPending}>
          Add first month
        </Button>
      </div>
    );
  }

  const up = (fn: (m: Month) => Month) => setDraft((d) => (d ? fn(d) : d));
  const setForum = <K extends keyof Forum>(k: K, v: Forum[K]) => up((m) => ({ ...m, forum: { ...m.forum, [k]: v } }));
  const warnings = monthWarnings(draft);
  const nextLabel = months.length ? monthLabel(nextMonthKey(monthKey(months[months.length - 1]!.period))) : 'month';
  const f = draft.forum;

  return (
    <div className="grid grid-cols-1 gap-8 min-[1440px]:grid-cols-[minmax(0,1fr)_minmax(480px,40%)]">
      <div className="min-w-0">
        {/* Month controls */}
        <div className="flex flex-wrap items-end gap-4 border-t border-line pt-6">
          <SelectInput label="Month" className="w-[200px]" value={draft.id} onChange={(e) => setSelectedId(e.target.value)}>
            {months
              .slice()
              .reverse()
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {monthLabel(monthKey(m.period))}
                  {m.published ? '' : ' (draft)'}
                </option>
              ))}
          </SelectInput>
          <Button size="sm" variant="outline" arrow="none" onClick={() => add.mutate()} disabled={add.isPending}>
            {add.isPending ? 'Adding…' : `Add ${nextLabel} (copies latest)`}
          </Button>
          <div className="flex h-9 items-center">
            <Toggle label={draft.published ? 'Published · visible to client' : 'Draft · hidden from client'} checked={draft.published} onChange={(v) => up((m) => ({ ...m, published: v }))} />
          </div>
          <div className="ml-auto flex h-9 items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-[12px] text-bad">Delete {monthLabel(monthKey(draft.period))} permanently?</span>
                <Button size="sm" variant="danger" arrow="none" onClick={() => del.mutate(draft.id)} disabled={del.isPending}>
                  Delete
                </Button>
                <Button size="sm" variant="quiet" arrow="none" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="quiet" arrow="none" onClick={() => setConfirmDelete(true)}>
                Delete month
              </Button>
            )}
          </div>
        </div>

        {/* Sticky live summary */}
        <div className="sticky top-12 z-20 -mx-1 mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 border-y border-line bg-paper/95 px-1 py-3 backdrop-blur">
          {[
            ['AI Readiness', String(aiReadiness(draft))],
            ['NAP', `${draft.nap}%`],
            ['Entity', `${draft.entity}%`],
            ['Listings', `${consistentListings(draft)}/${draft.sources.length}`],
            ['Community', `${f.authority}%`],
          ].map(([l, v]) => (
            <div key={l} className="flex items-baseline gap-2">
              <span className="t-meta text-muted">{l}</span>
              <span className="t-mono text-[15px]">{v}</span>
            </div>
          ))}
          <div className="ml-auto">
            <SaveStatus state={save} />
          </div>
        </div>

        <FormGroup title="Core metrics" aside="0 to 100. AI Readiness is calculated from these and the engine scores.">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Slider label="NAP Accuracy" value={draft.nap} onChange={(v) => up((m) => ({ ...m, nap: v }))} />
            <Slider label="Entity Strength" value={draft.entity} onChange={(v) => up((m) => ({ ...m, entity: v }))} />
            <Slider label="Schema Coverage" value={draft.schema_cov} onChange={(v) => up((m) => ({ ...m, schema_cov: v }))} />
            <Slider label="Knowledge Graph Signals" value={draft.knowledge} onChange={(v) => up((m) => ({ ...m, knowledge: v }))} />
            <NumberInput label="Brand mentions (count)" value={draft.mentions} onChange={(v) => up((m) => ({ ...m, mentions: v }))} />
          </div>
        </FormGroup>

        <FormGroup title="NAP by field" aside="Match rate for each data point across listings. ≥ 90 shows as Consistent.">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {NAP_FIELDS.map(([k, label]) => (
              <Slider key={k} label={label} value={draft.nap_fields[k]} onChange={(v) => up((m) => ({ ...m, nap_fields: { ...m.nap_fields, [k]: v } }))} />
            ))}
          </div>
        </FormGroup>

        <FormGroup title="Entity components" aside="Feeds the radar chart.">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {ENTITY.map(([k, , full]) => (
              <Slider key={k} label={full} value={draft.entity_parts[k]} onChange={(v) => up((m) => ({ ...m, entity_parts: { ...m.entity_parts, [k]: v } }))} />
            ))}
          </div>
        </FormGroup>

        <FormGroup title="AI engine readiness" aside="Your estimate per engine for this month.">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {ENGINES.map(([k, name]) => (
              <Slider key={k} label={name} suffix="" value={draft.engines[k]} onChange={(v) => up((m) => ({ ...m, engines: { ...m.engines, [k]: v } }))} />
            ))}
          </div>
        </FormGroup>

        <FormGroup title="Directory listings" aside="Verified and Updated count as consistent.">
          <div className="flex flex-col">
            <div className="t-meta grid grid-cols-[1fr_140px_150px_32px] gap-2 pb-2 uppercase tracking-[0.06em] text-muted">
              <span>Directory</span>
              <span>Status</span>
              <span>Last updated</span>
              <span />
            </div>
            {draft.sources.map((s, i) => {
              const patch = (p: Partial<typeof s>) => up((m) => ({ ...m, sources: m.sources.map((x, j) => (j === i ? { ...x, ...p } : x)) }));
              return (
                <div key={i} className="grid grid-cols-[1fr_140px_150px_32px] items-center gap-2 border-t border-line py-1.5">
                  <input aria-label="Directory name" className={inputCls} value={s.name} onChange={(e) => patch({ name: e.target.value })} />
                  <select aria-label={`${s.name} status`} className={`${inputCls} select-caret appearance-none bg-[length:8px] bg-[right_10px_center] bg-no-repeat`} value={s.status} onChange={(e) => patch({ status: e.target.value as SourceStatus })}>
                    {SOURCE_STATUSES.map((k) => (
                      <option key={k} value={k}>
                        {STATUS_LABEL[k]}
                      </option>
                    ))}
                  </select>
                  <input aria-label={`${s.name} last updated`} type="date" className={`${inputCls} t-mono`} value={s.updated_at ?? ''} onChange={(e) => patch({ updated_at: e.target.value || null })} />
                  <IconButton label={`Remove ${s.name}`} onClick={() => up((m) => ({ ...m, sources: m.sources.filter((_, j) => j !== i) }))}>
                    <Close size={9} />
                  </IconButton>
                </div>
              );
            })}
            <div className="border-t border-line pt-3">
              <Button size="sm" variant="outline" arrow="none" onClick={() => up((m) => ({ ...m, sources: [...m.sources, { name: 'New directory', status: 'queued', updated_at: null }] }))}>
                Add directory
              </Button>
            </div>
          </div>
        </FormGroup>

        <FormGroup title="Work delivered" aside="Task counts. Feeds the work columns and monthly stacked chart.">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {WORK.map(([k, name]) => (
              <NumberInput key={k} label={name} value={draft.work[k]} onChange={(v) => up((m) => ({ ...m, work: { ...m.work, [k]: v } }))} />
            ))}
          </div>
        </FormGroup>

        <FormGroup title="Community program" aside="Internal labels. The client report shows neutral wording only.">
          <div className="flex flex-col gap-6">
            <SelectInput label="Current phase" className="max-w-[320px]" value={f.phase} onChange={(e) => setForum('phase', Number(e.target.value))}>
              {PHASES.map(([p], i) => (
                <option key={p} value={i + 1}>
                  {i + 1}. {p}
                </option>
              ))}
            </SelectInput>
            <div>
              <div className="t-meta mb-3 text-ink">Reddit</div>
              <div className="grid grid-cols-2 gap-5 md:grid-cols-5">
                <NumberInput label="Profiles created" value={f.rCreated} onChange={(v) => setForum('rCreated', v)} />
                <NumberInput label="In warm-up" value={f.rWarming} onChange={(v) => setForum('rWarming', v)} warn={f.rWarming + f.rActive > f.rCreated} />
                <NumberInput label="Active" value={f.rActive} onChange={(v) => setForum('rActive', v)} warn={f.rWarming + f.rActive > f.rCreated} />
                <NumberInput label="Karma (total)" value={f.rKarma} onChange={(v) => setForum('rKarma', v)} />
                <NumberInput label="Communities reached" value={f.rCommunities} onChange={(v) => setForum('rCommunities', v)} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <div className="t-meta mb-3 text-ink">Quora</div>
                <div className="grid grid-cols-2 gap-5">
                  <NumberInput label="Profiles" value={f.qProfiles} onChange={(v) => setForum('qProfiles', v)} />
                  <NumberInput label="Active" value={f.qActive} onChange={(v) => setForum('qActive', v)} warn={f.qActive > f.qProfiles} />
                </div>
              </div>
              <div>
                <div className="t-meta mb-3 text-ink">Niche forums</div>
                <div className="grid grid-cols-2 gap-5">
                  <NumberInput label="Profiles" value={f.fProfiles} onChange={(v) => setForum('fProfiles', v)} />
                  <NumberInput label="Active" value={f.fActive} onChange={(v) => setForum('fActive', v)} warn={f.fActive > f.fProfiles} />
                </div>
              </div>
            </div>
            <Slider label="Community authority" value={f.authority} onChange={(v) => setForum('authority', v)} />
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {f.weekly.map((w, i) => (
                <NumberInput
                  key={i}
                  label={`Week ${i + 1} actions`}
                  value={w}
                  onChange={(v) => setForum('weekly', f.weekly.map((x, j) => (j === i ? v : x)) as Forum['weekly'])}
                />
              ))}
            </div>
            {warnings.length ? (
              <div role="alert" className="flex flex-col gap-1 border-l-2 border-warn bg-white px-4 py-3 text-[12px] text-ink">
                {warnings.map((w) => (
                  <p key={w}>{w}</p>
                ))}
              </div>
            ) : null}
          </div>
        </FormGroup>

        <FormGroup title="Monthly highlight" aside="Shown to the client on the Overview and in Milestones.">
          <TextArea label="Highlight (visible to client)" id="m-note" rows={4} value={draft.note} onChange={(e) => up((m) => ({ ...m, note: e.target.value }))} />
        </FormGroup>
      </div>

      <div className="hidden min-[1440px]:block">
        <div className="sticky top-16 h-[calc(100vh-88px)]">
          <LivePreview client={client} months={previewMonths} current={draft} />
        </div>
      </div>
    </div>
  );
}
