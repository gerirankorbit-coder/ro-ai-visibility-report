import { Gauge, HBarList, Legend, LineChart } from '@/components/charts';
import { DeltaBadge } from '@/components/ui';
import { ENGINES, WORK } from '@/lib/constants';
import { monthKey, monthLabel } from '@/lib/format';
import { aiReadiness, buildMonthStatement, consistentListings, delta, engineAverage, readinessLevel, totalWork } from '@/lib/metrics';
import { T } from '@/lib/tokens';
import { KpiTile, Panel, Sheet } from '../Sheet';
import { useReport } from '../ReportContext';

export function SummaryPage() {
  const { report, current: m, prev: p, history } = useReport();
  const score = aiReadiness(m);
  const st = buildMonthStatement(report.client, m, p);
  const recent = history.slice(-6);
  const engAvg = Math.round(engineAverage(m));
  const cons = consistentListings(m);
  const work = totalWork(m);

  return (
    <Sheet section="summary">
      <div className="grid grid-cols-[300px_1fr] gap-6">
        <Panel title="AI Readiness Score">
          <div className="flex h-full flex-col items-center justify-center border border-ink px-4 pb-4 pt-3">
            <Gauge value={score} width={260} />
            <div className="mt-1 flex items-center gap-3">
              <span className="bg-grad px-2 py-[3px] text-[11px] font-bold text-black">{readinessLevel(score)}</span>
              <DeltaBadge value={delta(score, p ? aiReadiness(p) : null)} unit=" pts" />
            </div>
          </div>
        </Panel>
        <Panel title="Key Metrics" aside="Change vs last month">
          <div className="grid h-full grid-cols-2 gap-3">
            <KpiTile label="NAP Accuracy" value={m.nap} unit="%" delta={delta(m.nap, p?.nap)} deltaUnit=" pts" note="Name, address, phone" />
            <KpiTile label="Entity Strength" value={m.entity} unit="%" delta={delta(m.entity, p?.entity)} deltaUnit=" pts" note="How clearly AI knows you" />
            <KpiTile label="Consistent Listings" value={cons} unit={`/${m.sources.length}`} delta={delta(cons, p ? consistentListings(p) : null)} note="Directories matching" />
            <KpiTile label="AI Engine Readiness" value={engAvg} unit="/100" delta={delta(engAvg, p ? Math.round(engineAverage(p)) : null)} deltaUnit=" pts" note="Average of 5 engines" />
          </div>
        </Panel>
      </div>

      <p className="border-l-[3px] border-accent pl-4 text-[15px] leading-[1.5]">
        <span className="font-semibold text-ink">{st.lead}</span> <span className="text-ink-2">{st.rest}</span>
      </p>

      <div className="grid grid-cols-2 gap-6">
        <Panel title="Visibility Trend" aside={recent.length > 1 ? `Last ${recent.length} months` : 'First month'}>
          <LineChart
            label="AI Readiness, NAP accuracy and entity strength by month"
            labels={recent.map((x) => monthLabel(monthKey(x.period), 'short'))}
            width={420}
            height={230}
            series={[
              { name: 'NAP Accuracy', values: recent.map((x) => x.nap), color: 's3', shape: 'circle' },
              { name: 'Entity Strength', values: recent.map((x) => x.entity), color: 'compare', dash: '4 3', shape: 'triangle' },
              { name: 'AI Readiness', values: recent.map(aiReadiness), color: 'main', area: true },
            ]}
          />
          <Legend
            className="mt-2"
            items={[
              { name: 'AI Readiness', color: T.accent, value: score },
              { name: 'NAP', color: T.cyanInk, shape: 'circle', value: `${m.nap}%` },
              { name: 'Entity', color: T.compare, dash: '4 3', shape: 'triangle', value: `${m.entity}%` },
            ]}
          />
        </Panel>
        <Panel title="AI Engine Readiness" aside="Score out of 100">
          <HBarList
            label="AI engine readiness"
            suffix=""
            items={[
              ...ENGINES.map(([k, name]) => ({ label: name, value: m.engines[k], delta: delta(m.engines[k], p?.engines[k]) })),
              { label: 'Average readiness', value: engAvg, delta: delta(engAvg, p ? Math.round(engineAverage(p)) : null), emphasis: true },
            ]}
          />
        </Panel>
      </div>

      <Panel title="Work Delivered This Month" aside={`${work} optimization tasks`}>
        <div className="grid grid-cols-4 gap-3">
          {WORK.map(([k, title, desc]) => (
            <div key={k} className="flex flex-col bg-panel">
              <div className="flex flex-1 flex-col gap-1 px-3.5 py-3">
                <div className="text-[11.5px] font-semibold text-ink">{title}</div>
                <div className="num text-[34px] font-bold leading-none tracking-[-0.02em]">{m.work[k]}</div>
                <div className="text-[10.5px] leading-snug text-muted">{desc}</div>
              </div>
              <div className="bg-grad h-[3px]" aria-hidden />
            </div>
          ))}
        </div>
        {m.note ? (
          <div className="mt-3 border border-ink px-4 py-3">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.06em] text-accent">Highlight</div>
            <p className="line-clamp-3 text-[13px] leading-[1.5] text-ink">{m.note}</p>
          </div>
        ) : null}
      </Panel>
    </Sheet>
  );
}
