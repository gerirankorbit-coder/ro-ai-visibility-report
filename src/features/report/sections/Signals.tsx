import { useState } from 'react';
import { HBarList, Legend, Radar, Ring } from '@/components/charts';
import { BlockTabs, DeltaBadge, DisabledLink, IndexTable, SourceStatusChip, Statement, StatusChip, STATUS_TONE } from '@/components/ui';
import { ENGINES, ENTITY, NAP_FIELDS, STATUS_LABEL } from '@/lib/constants';
import { fmtDate, monthKey, monthLabel } from '@/lib/format';
import { consistentListings, delta, engineAverage, listingStatement } from '@/lib/metrics';
import { T } from '@/lib/tokens';
import { SOURCE_STATUSES, type Engines, type Source } from '@/types/schema';
import { Band, BlockHead } from '../Frame';
import { useReport } from '../ReportContext';

export function SignalsSection() {
  const { current: m, prev: p } = useReport();
  const counts = Object.fromEntries(SOURCE_STATUSES.map((s) => [s, m.sources.filter((x) => x.status === s).length])) as Record<(typeof SOURCE_STATUSES)[number], number>;
  const ls = listingStatement(m);
  const [engine, setEngine] = useState<keyof Engines>('aio');
  const eng = ENGINES.find((e) => e[0] === engine)!;
  const avgNow = Math.round(engineAverage(m));
  const curName = monthLabel(monthKey(m.period), 'shortYear');
  const prevName = p ? monthLabel(monthKey(p.period), 'shortYear') : '';

  return (
    <>
      {/* NAP accuracy */}
      <Band>
        <BlockHead
          label="NAP Accuracy"
          title="Name, address and phone consistency across the web"
          description="AI engines cross-check your business details across many sources. Consistent details make you easier to trust and cite."
          aside={<DeltaBadge value={delta(m.nap, p?.nap)} unit=" pts" />}
        />
        <div className="grid grid-cols-1 gap-12 @lg:grid-cols-12 @lg:items-center">
          <div className="flex flex-col items-start gap-4 @lg:col-span-4">
            <Ring value={m.nap} size={220} stroke={14} label={`Overall NAP accuracy ${m.nap}%`} sub="overall accuracy" />
          </div>
          <div className="@lg:col-span-7 @lg:col-start-6">
            <HBarList
              label="NAP accuracy by field"
              deltaUnit=""
              items={NAP_FIELDS.map(([k, label]) => ({ label, value: m.nap_fields[k], delta: delta(m.nap_fields[k], p?.nap_fields[k]) }))}
            />
          </div>
        </div>
      </Band>

      {/* Listing consistency */}
      <section className="bg-paper">
        <div className="shell pb-[72px] @lg:pb-[120px]">
          <BlockHead label="Listing consistency" title={`${consistentListings(m)} of ${m.sources.length} directories match`} description="Status of your business listing on each directory we manage." />
          <div className="grid grid-cols-1 gap-10 @lg:grid-cols-12">
            <div className="flex flex-col gap-8 @lg:col-span-4">
              <Statement lead={ls.lead} rest={ls.rest} className="!text-[22px] @lg:!text-[24px]" />
              <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Listing status summary">
                {SOURCE_STATUSES.map((s) => (
                  <li key={s}>
                    <StatusChip tone={STATUS_TONE[s]}>
                      <span className="t-mono mr-1">{counts[s]}</span>
                      {STATUS_LABEL[s]}
                    </StatusChip>
                  </li>
                ))}
              </ul>
            </div>
            <div className="@lg:col-span-8">
              <IndexTable<Source>
                caption="Directory listings"
                minWidth={520}
                rows={m.sources}
                rowKey={(r, i) => `${r.name}-${i}`}
                columns={[
                  { key: 'dir', header: 'Directory', render: (r) => <span className="text-[12px]">{r.name}</span> },
                  { key: 'status', header: 'Status', render: (r) => <SourceStatusChip status={r.status} />, width: '140px' },
                  { key: 'upd', header: 'Last updated', render: (r) => <span className="t-mono text-[11.5px] text-ink-2">{fmtDate(r.updated_at)}</span>, width: '140px' },
                  { key: 'view', header: <span className="sr-only">Link</span>, align: 'right', render: () => <DisabledLink>View</DisabledLink>, width: '70px', className: 'pr-0' },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Entity building */}
      <section className="bg-paper">
        <div className="shell pb-[72px] @lg:pb-[120px]">
          <BlockHead label="Entity building" title="How clearly AI systems recognise your business" description="Six signals AI engines use to confirm your business is one well-defined entity." aside={<span className="t-mono text-[12px]">{m.entity}% strength</span>} />
          <div className="grid grid-cols-1 gap-12 @lg:grid-cols-12 @lg:items-center">
            <div className="flex flex-col gap-4 @lg:col-span-7">
              <Radar
                label={`Entity building signals, ${curName}${p ? ` compared with ${prevName}` : ''}`}
                axes={ENTITY.map(([key, label]) => ({ key, label }))}
                current={m.entity_parts}
                previous={p?.entity_parts ?? null}
                currentName={curName}
                previousName={prevName}
              />
              <Legend
                className="justify-center"
                items={[{ name: `${curName} (current)`, color: T.ink }, ...(p ? [{ name: `${prevName} (previous)`, color: T.compare, dash: '4 3', shape: 'circle' as const }] : [])]}
              />
            </div>
            <div className="@lg:col-span-5">
              <HBarList label="Entity components" items={ENTITY.map(([k, , full]) => ({ label: full, value: m.entity_parts[k], delta: delta(m.entity_parts[k], p?.entity_parts[k]) }))} />
            </div>
          </div>
        </div>
      </section>

      {/* AI engine readiness */}
      <Band tone="dark">
        <BlockHead tone="dark" label="AI engine readiness" title="Likelihood of being cited in AI-generated answers" description="Our estimate per engine, based on the signals each one relies on." />
        <BlockTabs
          tone="dark"
          idBase="engines"
          label="AI engines"
          value={engine}
          onChange={setEngine}
          items={ENGINES.map(([k, name]) => ({ value: k, title: name, description: <span className="t-mono">{m.engines[k]} / 100</span> }))}
        />
        <div role="tabpanel" id="engines-panel" aria-labelledby={`engines-tab-${engine}`} className="grid grid-cols-1 gap-8 border-b border-line-d py-12 @md:grid-cols-12 @md:items-end">
          <div className="@md:col-span-6">
            <div className="t-display-l text-white">{m.engines[engine]}</div>
          </div>
          <div className="flex flex-col gap-3 @md:col-span-6 @md:items-end @md:text-right">
            <DeltaBadge value={delta(m.engines[engine], p?.engines[engine])} unit=" pts" tone="dark" />
            <p className="max-w-[40ch] text-[14px] text-white">{eng[2]}</p>
            <p className="t-meta text-muted-d">{eng[1]} · readiness out of 100</p>
          </div>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-10 @lg:grid-cols-12">
          <div className="@lg:col-span-3">
            <p className="t-meta text-muted-d">All engines</p>
          </div>
          <div className="@lg:col-span-9">
            <HBarList
              tone="dark"
              label="AI engine readiness"
              suffix=""
              items={[
                ...ENGINES.map(([k, name]) => ({ label: name, value: m.engines[k], delta: delta(m.engines[k], p?.engines[k]) })),
                { label: 'Average readiness', value: avgNow, delta: delta(avgNow, p ? Math.round(engineAverage(p)) : null), emphasis: true },
              ]}
            />
          </div>
        </div>
      </Band>
    </>
  );
}
