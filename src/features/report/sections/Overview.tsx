import { Link } from 'react-router-dom';
import { LineChart, Legend, Sparkline } from '@/components/charts';
import { ArrowUpRight, DeltaBadge, EmberHero, KpiBlock, KpiRow, LogoStrip, ProgressBar, SectionLabel, Statement } from '@/components/ui';
import { TRACKED_ON, WORK } from '@/lib/constants';
import { monthKey, monthLabel } from '@/lib/format';
import { aiReadiness, buildMonthStatement, consistentListings, delta, readinessLevel, totalWork } from '@/lib/metrics';
import { T } from '@/lib/tokens';
import { cn } from '@/lib/cn';
import { Band, BlockHead } from '../Frame';
import { useReport } from '../ReportContext';

export function OverviewSection() {
  const { report, current: m, prev: p, history, href } = useReport();
  const score = aiReadiness(m);
  const prevScore = p ? aiReadiness(p) : null;
  const st = buildMonthStatement(report.client, m, p);
  const labels = history.map((x) => monthLabel(monthKey(x.period), 'short'));
  const cons = consistentListings(m);
  const work = totalWork(m);
  const maxWork = Math.max(1, ...WORK.map(([k]) => m.work[k]));

  const kpis = [
    { label: 'NAP Accuracy', value: m.nap, unit: '%', d: delta(m.nap, p?.nap), du: ' pts', spark: history.map((x) => x.nap), caption: 'vs last month', max: 100 },
    { label: 'Entity Strength', value: m.entity, unit: '%', d: delta(m.entity, p?.entity), du: ' pts', spark: history.map((x) => x.entity), caption: 'vs last month', max: 100 },
    { label: 'Schema Coverage', value: m.schema_cov, unit: '%', d: delta(m.schema_cov, p?.schema_cov), du: ' pts', spark: history.map((x) => x.schema_cov), caption: 'vs last month', max: 100 },
    { label: 'Knowledge Graph', value: m.knowledge, unit: '%', d: delta(m.knowledge, p?.knowledge), du: ' pts', spark: history.map((x) => x.knowledge), caption: 'vs last month', max: 100 },
    {
      label: 'Consistent Listings',
      value: cons,
      unit: `/${m.sources.length}`,
      d: delta(cons, p ? consistentListings(p) : null),
      du: '',
      spark: history.map((x) => (x.sources.length ? (consistentListings(x) / x.sources.length) * 100 : 0)),
      caption: 'vs last month',
      max: 100,
    },
    { label: 'Brand Mentions', value: m.mentions, unit: '', d: delta(m.mentions, p?.mentions), du: '', spark: history.map((x) => x.mentions), caption: 'vs last month', max: undefined },
  ];

  return (
    <>
      {/* Hero band */}
      <Band tone="dark">
        <div className="mb-14 flex flex-wrap items-center justify-between gap-4">
          <SectionLabel tone="dark">AI Readiness score</SectionLabel>
          <div className="flex items-center gap-4">
            <span className="t-meta text-muted-d">{readinessLevel(score)} · out of 100</span>
            <DeltaBadge value={delta(score, prevScore)} unit=" pts" tone="dark" />
          </div>
        </div>
        <EmberHero left="Visibility" right="Authority" center={score} centerLabel={`AI Readiness score ${score} out of 100`} />
        <div className="mt-16 grid grid-cols-1 gap-10 @md:grid-cols-2 @md:items-end">
          <p className="t-meta max-w-[300px] text-white">Combined strength of your business data, entity signals and presence across AI answer engines.</p>
          <ul className="flex flex-col @md:ml-auto @md:w-[300px]">
            {[
              { to: href('signals'), label: 'NAP Accuracy', v: `${m.nap}%` },
              { to: href('signals'), label: 'Entity Strength', v: `${m.entity}%` },
              { to: href('signals'), label: 'View AI Signals', v: '' },
            ].map((l) => (
              <li key={l.label} className="border-t border-line-d last:border-b">
                <Link to={l.to} className="group flex h-10 items-center justify-between text-[11px] text-white">
                  <span className="underline decoration-white/50 decoration-1 underline-offset-4 group-hover:decoration-2">
                    {l.label}
                    {l.v ? <span className="t-mono ml-2">{l.v}</span> : null}
                  </span>
                  <ArrowUpRight size={9} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Band>

      {/* Logo strip */}
      <section className="bg-paper">
        <div className="shell py-10">
          <LogoStrip label="Tracked across" names={TRACKED_ON} />
        </div>
        <div className="shell">
          <div className="h-px bg-line" />
        </div>
      </section>

      {/* Statement + KPIs */}
      <Band>
        <div className="grid grid-cols-1 gap-6 @lg:grid-cols-12">
          <div className="@lg:col-span-3">
            <SectionLabel as="div">This month</SectionLabel>
          </div>
          <Statement className="@lg:col-span-9" lead={st.lead} rest={st.rest} />
        </div>
        <div className="mt-24">
          <BlockHead label="Key metrics" description="Change is shown against the previous month. Lines trace every month since onboarding." />
          <KpiRow cols={6}>
            {kpis.map((k) => (
              <KpiBlock
                key={k.label}
                label={k.label}
                value={k.value}
                unit={k.unit}
                delta={k.d}
                deltaUnit={k.du}
                caption={k.caption}
                aside={<Sparkline values={k.spark} max={k.max ?? Math.max(1, ...k.spark)} label={`${k.label} by month: ${k.spark.map((v) => Math.round(v)).join(', ')}`} />}
              />
            ))}
          </KpiRow>
        </div>
      </Band>

      {/* Visibility trend */}
      <section className="bg-paper">
        <div className="shell pb-[72px] @lg:pb-[120px]">
          <BlockHead label="Visibility trend" title="Month over month since onboarding" description="AI Readiness combines NAP accuracy, entity strength, schema, knowledge graph and AI engine readiness." />
          <div className="grid grid-cols-1 gap-10 @lg:grid-cols-12">
            <div className="@lg:col-span-3">
              <Legend
                className="!flex-col !items-start !gap-y-4"
                items={[
                  { name: 'AI Readiness', color: T.red, value: score },
                  { name: 'NAP Accuracy', color: T.ink, value: `${m.nap}%`, shape: 'circle' },
                  { name: 'Entity Strength', color: T.compare, dash: '4 3', value: `${m.entity}%`, shape: 'triangle' },
                ]}
              />
            </div>
            <div className="@lg:col-span-9">
              <LineChart
                label="Visibility trend: AI Readiness, NAP accuracy and entity strength by month"
                labels={labels}
                series={[
                  { name: 'NAP Accuracy', values: history.map((x) => x.nap), color: 'main', shape: 'circle', area: true },
                  { name: 'Entity Strength', values: history.map((x) => x.entity), color: 'compare', dash: '4 3', shape: 'triangle' },
                  { name: 'AI Readiness', values: history.map(aiReadiness), color: 'accent' },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Work delivered */}
      <Band tone="dark">
        <BlockHead
          tone="dark"
          label="Work delivered this month"
          title={`${work} optimization ${work === 1 ? 'task' : 'tasks'} in ${monthLabel(monthKey(m.period))}`}
          description="Completed work by category. Bars compare categories within the month."
        />
        <div className="grid grid-cols-1 gap-y-12 @md:grid-cols-2 @lg:grid-cols-4">
          {WORK.map(([k, title, desc], i) => (
            <div key={k} className={cn('flex flex-col gap-4', i % 2 === 1 && '@md:border-l @md:border-line-d @md:pl-6', i > 0 && '@lg:border-l @lg:border-line-d @lg:pl-6', '@lg:pr-6')}>
              <h4 className="t-h3 text-white">{title}</h4>
              <div className="font-display num text-[88px] font-medium leading-[0.85] tracking-[-0.06em] text-white">{m.work[k]}</div>
              <p className="t-meta min-h-[30px] text-muted-d">{desc}</p>
              <ProgressBar value={m.work[k]} max={maxWork} tone="dark" accent={m.work[k] === maxWork} label={`${title}: ${m.work[k]}`} />
            </div>
          ))}
        </div>
        {m.note ? (
          <div className="mt-24 grid grid-cols-1 gap-6 border-t border-line-d pt-5 @lg:grid-cols-12">
            <div className="@lg:col-span-3">
              <SectionLabel tone="dark" as="div">
                Highlight
              </SectionLabel>
            </div>
            <p className="t-statement text-white @lg:col-span-9">{m.note}</p>
          </div>
        ) : null}
      </Band>
    </>
  );
}
