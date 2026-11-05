import { Funnel, Heatmap, HBarList, LineChart, Ring } from '@/components/charts';
import { Check, DeltaBadge, KpiBlock, KpiRow, ProgressBar } from '@/components/ui';
import { PHASES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { fmtInt, monthKey, monthLabel } from '@/lib/format';
import { clamp, delta, niceMax, splitWeekly, weeklyTotal } from '@/lib/metrics';
import { Band, BlockHead } from '../Frame';
import { useReport } from '../ReportContext';

/*
 * Client-facing wording stays neutral and visual: profiles, trust building,
 * community actions, reputation, communities reached.
 */
export function CommunitySection() {
  const { report, current: m, prev: p, history } = useReport();
  const f = m.forum;
  const pf = p?.forum;
  const phase = clamp(f.phase, 1, 4);
  const grid = splitWeekly(f.weekly, `${report.client.id}:${m.period}`);
  const total = weeklyTotal(m);
  const maxWeek = Math.max(1, ...f.weekly);
  const karmaMax = niceMax(Math.max(10, ...history.map((x) => x.forum.rKarma)));

  const platforms = [
    { name: 'Reddit', active: f.rActive, total: f.rCreated },
    { name: 'Quora', active: f.qActive, total: f.qProfiles },
    { name: 'Niche forums', active: f.fActive, total: f.fProfiles },
  ];

  return (
    <>
      {/* Phase */}
      <Band>
        <BlockHead
          label="Community presence phase"
          title={`Phase ${phase} of 4 · ${PHASES[phase - 1]![0]}`}
          description="Where your brand currently stands in the community program. Each phase builds reputation that AI engines draw on."
        />
        <ol className="grid grid-cols-1 border-y border-line @md:grid-cols-4">
          {PHASES.map(([title, desc], i) => {
            const n = i + 1;
            const done = n < phase;
            const cur = n === phase;
            return (
              <li
                key={title}
                aria-current={cur ? 'step' : undefined}
                className={cn('flex min-h-[132px] flex-col gap-3 px-4 py-5', i > 0 && 'border-t border-line @md:border-l @md:border-t-0', cur ? 'bg-ink text-white' : '')}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('t-mono text-[11px]', cur ? 'text-white' : done ? 'text-ink' : 'text-muted')}>0{n}</span>
                  {done ? (
                    <span className="flex items-center gap-1.5 text-[10.5px] text-ink">
                      <Check size={10} /> Done
                    </span>
                  ) : cur ? (
                    <span className="flex items-center gap-1.5 text-[10.5px] text-white">
                      <span className="inline-block h-[6px] w-[6px] bg-red" /> Current
                    </span>
                  ) : (
                    <span className="text-[10.5px] text-muted">Upcoming</span>
                  )}
                </div>
                <div className="mt-auto">
                  <div className={cn('t-h3', cur ? 'text-white' : done ? 'text-ink' : 'text-muted')}>{title}</div>
                  <div className={cn('t-meta mt-1', cur ? 'text-muted-d' : 'text-muted')}>{desc}</div>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-10 grid grid-cols-1 gap-4 @md:grid-cols-12 @md:items-center">
          <div className="text-[12px] text-ink @md:col-span-3">Community authority</div>
          <div className="@md:col-span-7">
            <ProgressBar value={f.authority} height={6} accent label="Community authority" />
          </div>
          <div className="flex items-center gap-3 @md:col-span-2 @md:justify-end">
            <DeltaBadge value={delta(f.authority, pf?.authority)} unit=" pts" compact />
            <span className="t-mono text-[13px]">{f.authority}%</span>
          </div>
        </div>
      </Band>

      {/* KPIs */}
      <section className="bg-paper">
        <div className="shell pb-[72px] @lg:pb-[120px]">
          <KpiRow cols={4}>
            <KpiBlock label="Profiles Created" value={f.rCreated} delta={delta(f.rCreated, pf?.rCreated)} caption="vs last month" />
            <KpiBlock label="Building trust" value={f.rWarming} delta={delta(f.rWarming, pf?.rWarming)} caption="vs last month" />
            <KpiBlock label="Active Profiles" value={f.rActive} delta={delta(f.rActive, pf?.rActive)} caption="vs last month" />
            <KpiBlock label="Communities Reached" value={f.rCommunities} delta={delta(f.rCommunities, pf?.rCommunities)} caption="vs last month" />
          </KpiRow>
        </div>
      </section>

      {/* Pipeline */}
      <section className="bg-paper">
        <div className="shell pb-[72px] @lg:pb-[120px]">
          <BlockHead label="Profile pipeline" title="Profiles move from trust building to active" description="Reputation grows as profiles become established members of relevant communities." />
          <div className="grid grid-cols-1 gap-12 @lg:grid-cols-12">
            <div className="@lg:col-span-5">
              <Funnel
                label="Profile pipeline"
                steps={[
                  { label: 'Created', value: f.rCreated },
                  { label: 'Building trust', value: f.rWarming },
                  { label: 'Active', value: f.rActive },
                ]}
              />
            </div>
            <div className="flex flex-col gap-4 @lg:col-span-7">
              <div className="flex items-baseline justify-between">
                <span className="t-meta text-muted">Reputation growth</span>
                <span className="flex items-baseline gap-3">
                  <DeltaBadge value={delta(f.rKarma, pf?.rKarma)} compact />
                  <span className="t-mono text-[13px]">{fmtInt(f.rKarma)}</span>
                </span>
              </div>
              <LineChart
                label="Reputation score by month"
                labels={history.map((x) => monthLabel(monthKey(x.period), 'short'))}
                series={[{ name: 'Reputation', values: history.map((x) => x.forum.rKarma), color: 'main', area: true }]}
                max={karmaMax}
                height={240}
                fmt={(v) => fmtInt(v)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Activity */}
      <section className="bg-paper">
        <div className="shell pb-[72px] @lg:pb-[120px]">
          <BlockHead label="Engagement activity" title={`${total} community actions this month`} description="Daily distribution of community actions across the four weeks of the month." />
          <div className="grid grid-cols-1 gap-12 @lg:grid-cols-12">
            <div className="@lg:col-span-6">
              <Heatmap grid={grid} label={`Community actions per day, ${monthLabel(monthKey(m.period))}`} />
            </div>
            <div className="@lg:col-span-5 @lg:col-start-8">
              <HBarList
                label="Community actions per week"
                max={maxWeek}
                suffix=""
                items={f.weekly.map((v, i) => ({ label: `Week ${i + 1}`, value: v, display: `${v} actions`, emphasis: false }))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Platform coverage */}
      <Band tone="dark">
        <BlockHead tone="dark" label="Platform coverage" title="Active profiles out of total on each platform" />
        <div className="grid grid-cols-1 gap-y-12 @md:grid-cols-3">
          {platforms.map((x, i) => {
            const pc = x.total ? Math.round((x.active / x.total) * 100) : 0;
            return (
              <div key={x.name} className={cn('flex flex-col items-start gap-5', i > 0 && '@md:border-l @md:border-line-d @md:pl-8')}>
                <Ring value={pc} size={152} stroke={12} tone="dark" label={`${x.name}: ${x.active} of ${x.total} profiles active`} center={`${x.active}/${x.total}`} sub="active" fontSize={34} />
                <div>
                  <div className="t-h2 text-white">{x.name}</div>
                  <div className="t-meta mt-1 text-muted-d">{pc}% active</div>
                </div>
              </div>
            );
          })}
        </div>
      </Band>
    </>
  );
}
