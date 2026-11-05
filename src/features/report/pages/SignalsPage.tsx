import { HBarList, Ring } from '@/components/charts';
import { DeltaBadge, SourceStatusChip } from '@/components/ui';
import { ENTITY, NAP_FIELDS, STATUS_LABEL } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { fmtDate } from '@/lib/format';
import { consistentListings, delta, listingStatement } from '@/lib/metrics';
import { SOURCE_STATUSES, type Source } from '@/types/schema';
import { KpiTile, Panel, ReportTable, Sheet } from '../Sheet';
import { useReport } from '../ReportContext';

const STATUS_TILE: Record<(typeof SOURCE_STATUSES)[number], string> = {
  verified: 'bg-[#DCFCE7] border-[#15803D]',
  synced: 'bg-[#E0F7FD] border-[#0E9FC6]',
  progress: 'bg-[#FAE4CC] border-[#CE6C01]',
  queued: 'bg-[#F1F1F3] border-[#A1A1AA]',
};

/** At most 14 rows in two columns so the page always fits. */
const MAX_LISTINGS = 14;

export function SignalsPage() {
  const { current: m, prev: p } = useReport();
  const counts = Object.fromEntries(SOURCE_STATUSES.map((s) => [s, m.sources.filter((x) => x.status === s).length])) as Record<(typeof SOURCE_STATUSES)[number], number>;
  const ls = listingStatement(m);
  const shown = m.sources.slice(0, MAX_LISTINGS);
  const half = Math.ceil(shown.length / 2);
  const cols = [shown.slice(0, half), shown.slice(half)].filter((c) => c.length);
  const table = (rows: Source[]) => (
    <ReportTable
      head={['Directory', 'Status', 'Updated']}
      align={['left', 'left', 'right']}
      rows={rows.map((s) => [<span className="font-medium">{s.name}</span>, <SourceStatusChip status={s.status} />, <span className="num text-[11px] text-ink-2">{s.updated_at ? fmtDate(s.updated_at).replace(/, \d{4}$/, '') : '—'}</span>])}
    />
  );

  return (
    <Sheet section="signals">
      <Panel title="NAP Accuracy" aside={<span className="flex items-center gap-2">Overall <DeltaBadge value={delta(m.nap, p?.nap)} unit=" pts" /></span>}>
        <div className="grid grid-cols-[200px_1fr] items-center gap-8 border border-ink px-6 py-5">
          <Ring value={m.nap} size={180} stroke={16} label={`Overall NAP accuracy ${m.nap}%`} sub="overall accuracy" />
          <HBarList label="NAP accuracy by field" items={NAP_FIELDS.map(([k, label]) => ({ label, value: m.nap_fields[k], delta: delta(m.nap_fields[k], p?.nap_fields[k]) }))} />
        </div>
      </Panel>

      <Panel title="Listing Consistency" aside={`${consistentListings(m)} of ${m.sources.length} directories match`}>
        <div className="mb-3 grid grid-cols-4 gap-3">
          {SOURCE_STATUSES.map((s) => (
            <div key={s} className={cn('flex items-baseline justify-between border-l-[3px] px-3 py-2', STATUS_TILE[s])}>
              <span className="text-[11.5px] font-semibold">{STATUS_LABEL[s]}</span>
              <span className="num text-[22px] font-bold leading-none">{counts[s]}</span>
            </div>
          ))}
        </div>
        <p className="mb-3 text-[13px] leading-snug">
          <span className="font-semibold">{ls.lead}</span> <span className="text-ink-2">{ls.rest}</span>
        </p>
        <div className={cn('grid gap-4', cols.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>{cols.map((c, i) => <div key={i}>{table(c)}</div>)}</div>
        {m.sources.length > MAX_LISTINGS ? <p className="mt-2 text-[10.5px] text-muted">+ {m.sources.length - MAX_LISTINGS} more directories tracked</p> : null}
      </Panel>

      <Panel title="Entity Building" aside={<span className="flex items-center gap-2">Entity strength <b className="text-ink">{m.entity}%</b> <DeltaBadge value={delta(m.entity, p?.entity)} unit=" pts" /></span>}>
        <div className="grid grid-cols-3 gap-3">
          <KpiTile label="Schema Coverage" value={m.schema_cov} unit="%" delta={delta(m.schema_cov, p?.schema_cov)} deltaUnit=" pts" />
          <KpiTile label="Knowledge Graph" value={m.knowledge} unit="%" delta={delta(m.knowledge, p?.knowledge)} deltaUnit=" pts" />
          <KpiTile label="Brand Mentions" value={m.mentions} delta={delta(m.mentions, p?.mentions)} note="found across the web" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-8">
          {[ENTITY.slice(0, 3), ENTITY.slice(3)].map((group, i) => (
            <HBarList key={i} label="Entity components" items={group.map(([k, , full]) => ({ label: full, value: m.entity_parts[k], delta: delta(m.entity_parts[k], p?.entity_parts[k]) }))} />
          ))}
        </div>
      </Panel>
    </Sheet>
  );
}
