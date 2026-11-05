import { Ring } from '@/components/charts';
import { Check, DeltaBadge, ProgressBar } from '@/components/ui';
import { PHASES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { fmtInt, monthKey, monthLabel } from '@/lib/format';
import { aiReadiness, clamp, consistentListings, delta, engineAverage, weeklyTotal } from '@/lib/metrics';
import type { Month } from '@/types/schema';
import { KpiTile, Panel, ReportTable, Sheet } from '../Sheet';
import { useReport } from '../ReportContext';

/*
 * Client-facing wording stays neutral: profiles, trust building, community actions,
 * reputation, communities reached.
 */
function Cell({ v, d, unit = '' }: { v: string | number; d: number | null; unit?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="num">
        {v}
        {unit}
      </span>
      {d !== null && d !== 0 ? <DeltaBadge value={d} compact /> : null}
    </span>
  );
}

export function CommunityPage() {
  const { current: m, prev: p, history } = useReport();
  const f = m.forum;
  const pf = p?.forum;
  const phase = clamp(f.phase, 1, 4);
  const recent = history.slice(-6);
  const prevOf = (x: Month) => {
    const i = history.indexOf(x);
    return i > 0 ? history[i - 1]! : null;
  };
  const platforms = [
    { name: 'Reddit', active: f.rActive, total: f.rCreated },
    { name: 'Quora', active: f.qActive, total: f.qProfiles },
    { name: 'Niche forums', active: f.fActive, total: f.fProfiles },
  ];
  const milestones = history.slice(-3).reverse().filter((x) => x.note);

  return (
    <Sheet section="community">
      <Panel title="Community Presence" aside={`Phase ${phase} of 4`}>
        <ol className="grid grid-cols-4 border border-ink">
          {PHASES.map(([title, desc], i) => {
            const n = i + 1;
            const done = n < phase;
            const cur = n === phase;
            return (
              <li key={title} className={cn('flex flex-col gap-1 px-3 py-3', i > 0 && 'border-l border-ink', cur && 'bg-grad')} aria-current={cur ? 'step' : undefined}>
                <div className="flex items-center justify-between text-[10.5px] font-semibold">
                  <span className={done || cur ? 'text-ink' : 'text-ghost'}>Step {n}</span>
                  {done ? (
                    <span className="flex items-center gap-1 text-good">
                      <Check size={9} /> Done
                    </span>
                  ) : cur ? (
                    <span className="text-black">Current</span>
                  ) : null}
                </div>
                <div className={cn('text-[13px] font-bold', done || cur ? 'text-ink' : 'text-ghost')}>{title}</div>
                <div className={cn('text-[10.5px] leading-snug', cur ? 'text-black/75' : 'text-muted')}>{desc}</div>
              </li>
            );
          })}
        </ol>
        <div className="mt-3 grid grid-cols-[150px_1fr_auto] items-center gap-4">
          <span className="text-[12px] font-semibold">Community authority</span>
          <ProgressBar value={f.authority} height={8} label="Community authority" className="[&>div]:bg-grad" />
          <span className="flex items-center gap-2">
            <DeltaBadge value={delta(f.authority, pf?.authority)} unit=" pts" compact />
            <b className="num text-[13px]">{f.authority}%</b>
          </span>
        </div>
      </Panel>

      <div className="grid grid-cols-[1fr_330px] gap-6">
        <Panel title="Community Profiles">
          <div className="grid grid-cols-2 gap-3">
            <KpiTile label="Profiles Created" value={f.rCreated} delta={delta(f.rCreated, pf?.rCreated)} />
            <KpiTile label="Building Trust" value={f.rWarming} delta={delta(f.rWarming, pf?.rWarming)} />
            <KpiTile label="Active Profiles" value={f.rActive} delta={delta(f.rActive, pf?.rActive)} />
            <KpiTile label="Communities Reached" value={f.rCommunities} delta={delta(f.rCommunities, pf?.rCommunities)} />
          </div>
          <p className="mt-3 text-[12px] text-ink-2">
            <b className="text-ink">{weeklyTotal(m)}</b> community actions this month · reputation score <b className="text-ink">{fmtInt(f.rKarma)}</b>
          </p>
        </Panel>
        <Panel title="Platform Coverage" aside="Active of total">
          <div className="grid grid-cols-3 gap-2 border border-ink px-2 py-5">
            {platforms.map((x) => {
              const pc = x.total ? Math.round((x.active / x.total) * 100) : 0;
              return (
                <div key={x.name} className="flex flex-col items-center gap-2">
                  <Ring value={pc} size={88} stroke={9} label={`${x.name}: ${x.active} of ${x.total} active`} center={`${x.active}/${x.total}`} fontSize={20} />
                  <div className="text-center">
                    <div className="text-[12px] font-bold">{x.name}</div>
                    <div className="text-[10.5px] text-muted">{pc}% active</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel title="Month to Month" aside={recent.length > 1 ? `Last ${recent.length} months` : 'First month'}>
        <ReportTable
          head={['Month', 'AI Readiness', 'NAP', 'Entity', 'Listings', 'AI Engines', 'Community']}
          highlight={(i) => recent[i]?.period === m.period}
          rows={recent.map((x) => {
            const q = prevOf(x);
            return [
              <span className="font-semibold">{monthLabel(monthKey(x.period), 'shortYear')}</span>,
              <Cell v={aiReadiness(x)} d={q ? delta(aiReadiness(x), aiReadiness(q)) : null} />,
              <Cell v={x.nap} unit="%" d={delta(x.nap, q?.nap)} />,
              <Cell v={x.entity} unit="%" d={delta(x.entity, q?.entity)} />,
              <Cell v={`${consistentListings(x)}/${x.sources.length}`} d={q ? delta(consistentListings(x), consistentListings(q)) : null} />,
              <Cell v={Math.round(engineAverage(x))} d={q ? delta(Math.round(engineAverage(x)), Math.round(engineAverage(q))) : null} />,
              <Cell v={x.forum.authority} unit="%" d={delta(x.forum.authority, q?.forum.authority)} />,
            ];
          })}
        />
      </Panel>

      {milestones.length ? (
        <Panel title="Milestones">
          <ul className="border border-ink">
            {milestones.map((x, i) => (
              <li key={x.period} className={cn('grid grid-cols-[90px_1fr] gap-4 px-3 py-2.5', i > 0 && 'border-t border-ink')}>
                <span className="text-[12px] font-bold">{monthLabel(monthKey(x.period), 'shortYear')}</span>
                <span className="line-clamp-2 text-[12px] leading-snug text-ink">{x.note}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </Sheet>
  );
}
