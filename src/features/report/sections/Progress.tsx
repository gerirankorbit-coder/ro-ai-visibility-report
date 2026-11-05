import type { ReactNode } from 'react';
import { Legend, StackedBars, BAR_FILLS } from '@/components/charts';
import { DeltaBadge, IndexTable } from '@/components/ui';
import { WORK } from '@/lib/constants';
import { monthKey, monthLabel } from '@/lib/format';
import { aiReadiness, consistentListings, delta, engineAverage } from '@/lib/metrics';
import type { Month } from '@/types/schema';
import { Band, BlockHead } from '../Frame';
import { useReport } from '../ReportContext';

function Cell({ v, d, unit = '' }: { v: ReactNode; d: number | null; unit?: string }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="t-mono text-[12.5px]">
        {v}
        {unit}
      </span>
      {d !== null ? <DeltaBadge value={d} compact /> : null}
    </span>
  );
}

export function ProgressSection() {
  const { months, current } = useReport();
  const prevOf = (i: number) => (i > 0 ? months[i - 1]! : null);
  const curIdx = months.findIndex((x) => x.period === current.period);
  const fills = BAR_FILLS('dark');

  return (
    <>
      <Band>
        <BlockHead label="Month to month" title="Every tracked month side by side" description="Values with change against the month before. The current report month is marked." />
        <IndexTable<Month>
          caption="Month to month summary"
          minWidth={860}
          rows={months}
          rowKey={(r) => r.period}
          highlight={(r) => r.period === current.period}
          columns={[
            { key: 'month', header: 'Month', render: (r) => <span className="text-[12.5px] font-medium">{monthLabel(monthKey(r.period))}</span> },
            { key: 'ai', header: 'AI Readiness', render: (r, i) => <Cell v={aiReadiness(r)} d={prevOf(i) ? delta(aiReadiness(r), aiReadiness(prevOf(i)!)) : null} /> },
            { key: 'nap', header: 'NAP', render: (r, i) => <Cell v={r.nap} unit="%" d={delta(r.nap, prevOf(i)?.nap)} /> },
            { key: 'entity', header: 'Entity', render: (r, i) => <Cell v={r.entity} unit="%" d={delta(r.entity, prevOf(i)?.entity)} /> },
            {
              key: 'list',
              header: 'Listings',
              render: (r, i) => <Cell v={`${consistentListings(r)}/${r.sources.length}`} d={prevOf(i) ? delta(consistentListings(r), consistentListings(prevOf(i)!)) : null} />,
            },
            {
              key: 'eng',
              header: 'AI Engines',
              render: (r, i) => <Cell v={Math.round(engineAverage(r))} d={prevOf(i) ? delta(Math.round(engineAverage(r)), Math.round(engineAverage(prevOf(i)!))) : null} />,
            },
            { key: 'com', header: 'Community', render: (r, i) => <Cell v={r.forum.authority} unit="%" d={delta(r.forum.authority, prevOf(i)?.forum.authority)} /> },
          ]}
        />
      </Band>

      <Band tone="dark">
        <BlockHead tone="dark" label="Work delivered by month" title="Optimization tasks completed each month" description="Stacked by category. Totals shown above each bar." />
        <div className="grid grid-cols-1 gap-10 @lg:grid-cols-12">
          <div className="@lg:col-span-3">
            <Legend tone="dark" className="!flex-col !items-start !gap-y-3" items={WORK.map(([, name], i) => ({ name, color: fills[i]!, bar: true, hatch: i === 2 }))} />
          </div>
          <div className="@lg:col-span-9">
            <StackedBars
              tone="dark"
              label="Work delivered by month, stacked by category"
              labels={months.map((x) => monthLabel(monthKey(x.period), 'short'))}
              categories={WORK.map(([, name]) => name)}
              rows={months.map((x) => WORK.map(([k]) => x.work[k]))}
              currentIndex={curIdx}
            />
          </div>
        </div>
      </Band>

      <Band>
        <BlockHead label="Milestones" title="Key outcomes recorded each month" />
        <ol className="border-t border-line">
          {months
            .slice()
            .reverse()
            .map((x) => {
              const isCur = x.period === current.period;
              return (
                <li key={x.period} className="grid grid-cols-1 gap-2 border-b border-line py-5 @md:grid-cols-12 @md:gap-6" aria-current={isCur ? 'true' : undefined}>
                  <div className="t-mono flex items-center gap-2 text-[11.5px] text-ink @md:col-span-3">
                    {isCur ? <span className="inline-block h-[6px] w-[6px] bg-red" aria-hidden /> : <span className="inline-block w-[6px]" aria-hidden />}
                    {monthLabel(monthKey(x.period), 'shortYear')}
                  </div>
                  <p className="text-[14px] leading-relaxed text-ink @md:col-span-7">{x.note || 'Work in progress.'}</p>
                  <div className="t-mono text-[11px] text-muted @md:col-span-2 @md:text-right">AI {aiReadiness(x)}</div>
                </li>
              );
            })}
        </ol>
      </Band>
    </>
  );
}
