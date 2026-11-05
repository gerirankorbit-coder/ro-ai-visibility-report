import { Link } from 'react-router-dom';
import { Funnel, Gauge, HBarList, Heatmap, Legend, LineChart, Radar, Ring, Sparkline, StackedBars, BAR_FILLS } from '@/components/charts';
import { AgencyMark, SectionLabel } from '@/components/ui';
import { ENTITY } from '@/lib/constants';
import { splitWeekly } from '@/lib/metrics';
import { T } from '@/lib/tokens';

const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

function Block({ title, children, dark = false }: { title: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <section className={dark ? 'on-dark bg-black' : 'bg-paper'}>
      <div className="shell py-16">
        <div className={`mb-8 border-t pt-5 ${dark ? 'border-line-d' : 'border-line'}`}><SectionLabel tone={dark ? 'dark' : 'light'}>{title}</SectionLabel></div>
        {children}
      </div>
    </section>
  );
}

export default function StyleguideCharts() {
  return (
    <div className="@container min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/[0.92] backdrop-blur-md">
        <div className="shell flex h-12 items-center justify-between">
          <div className="flex items-center gap-2.5 text-[12px] font-medium"><AgencyMark size={16} /> Rank Orbit · Charts</div>
          <nav className="flex items-center gap-6 text-[11px]">
            <Link to="/styleguide" className="text-ink-2 hover:text-ink">Primitives</Link>
            <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-red" />Charts</span>
            <Link to="/demo" className="text-ink-2 hover:text-ink">Demo report</Link>
          </nav>
        </div>
      </header>
      <Block title="Gauge · Ring · Sparkline">
        <div className="grid grid-cols-1 items-center gap-12 @md:grid-cols-3">
          <Gauge value={73} />
          <Ring value={91} size={200} label="NAP accuracy 91%" sub="overall accuracy" />
          <div className="flex items-center gap-6"><Sparkline values={[58, 67, 75, 87, 91]} max={100} /><Sparkline values={[4, 9, 14, 20, 27]} /></div>
        </div>
      </Block>
      <Block title="Line chart">
        <Legend className="mb-6" items={[{ name: 'AI Readiness', color: T.red, value: 70 }, { name: 'NAP', color: T.ink, shape: 'circle', value: '91%' }, { name: 'Entity', color: T.compare, dash: '4 3', shape: 'triangle', value: '72%' }]} />
        <LineChart label="Demo line chart" labels={months} series={[
          { name: 'NAP', values: [58, 67, 75, 87, 91], color: 'main', shape: 'circle', area: true },
          { name: 'Entity', values: [34, 46, 55, 66, 72], color: 'compare', dash: '4 3', shape: 'triangle' },
          { name: 'AI Readiness', values: [29, 41, 52, 62, 70], color: 'accent' },
        ]} />
        <div className="mt-12 max-w-sm"><LineChart label="Single point" labels={['Oct']} series={[{ name: 'Only', values: [40], area: true }]} height={200} width={400} /></div>
      </Block>
      <Block title="Stacked bars" dark>
        <Legend tone="dark" className="mb-6" items={['NAP', 'Entity', 'Schema', 'Content'].map((n, i) => ({ name: n, color: BAR_FILLS('dark')[i]!, bar: true }))} />
        <StackedBars tone="dark" label="Demo bars" labels={months} categories={['NAP', 'Entity', 'Schema', 'Content']} rows={[[18, 10, 4, 6], [22, 15, 6, 8], [26, 18, 7, 10], [28, 21, 9, 12], [30, 24, 10, 14]]} currentIndex={4} />
      </Block>
      <Block title="Stacked bars (light)">
        <StackedBars label="Demo bars light" labels={months} categories={['NAP', 'Entity', 'Schema', 'Content']} rows={[[18, 10, 4, 6], [22, 15, 6, 8], [26, 18, 7, 10], [28, 21, 9, 12], [30, 24, 10, 14]]} currentIndex={4} />
      </Block>
      <Block title="Radar · HBar">
        <div className="grid grid-cols-1 gap-12 @lg:grid-cols-2">
          <Radar label="Entity radar" axes={ENTITY.map(([key, label]) => ({ key, label }))} current={{ schema: 85, sameAs: 80, kg: 58, reviews: 78, mentions: 60, topical: 70 }} previous={{ schema: 70, sameAs: 66, kg: 50, reviews: 70, mentions: 49, topical: 60 }} />
          <HBarList label="Bars" items={[{ label: 'Business Name', value: 100, delta: 0 }, { label: 'Address', value: 94, delta: 3 }, { label: 'Phone', value: 97, delta: -1 }, { label: 'Average', value: 64, delta: 5, emphasis: true }]} />
        </div>
      </Block>
      <Block title="Heatmap · Funnel">
        <div className="grid grid-cols-1 gap-12 @lg:grid-cols-2">
          <Heatmap label="Heatmap" grid={splitWeekly([40, 48, 52, 66], 'demo')} />
          <Funnel label="Funnel" steps={[{ label: 'Created', value: 10 }, { label: 'Building trust', value: 3 }, { label: 'Active', value: 7 }]} />
        </div>
      </Block>
      <Block title="Rings on black" dark>
        <div className="flex flex-wrap gap-16">
          <Ring value={70} size={152} tone="dark" label="Reddit" center="7/10" sub="active" fontSize={34} />
          <Ring value={100} size={152} tone="dark" label="Quora" center="3/3" sub="active" fontSize={34} />
          <Ring value={0} size={152} tone="dark" label="None" center="0/0" sub="active" fontSize={34} />
        </div>
      </Block>
    </div>
  );
}
