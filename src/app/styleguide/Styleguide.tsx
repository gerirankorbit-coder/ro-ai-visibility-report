import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AgencyMark, BlockTabs, Button, Checkbox, DeltaBadge, DisabledLink, EmberHero, IndexTable, KpiBlock, KpiRow, LogoStrip, ProgressBar,
  SectionLabel, Slider, SourceStatusChip, Statement, StatusChip, TagInput, TextInput, TextLink, Toggle, UnderlineTabs, VisualCard, SelectInput,
} from '@/components/ui';
import { Sparkline } from '@/components/charts';
import { T } from '@/lib/tokens';
import { TRACKED_ON } from '@/lib/constants';

const COLORS: Array<[string, string]> = [
  ['--paper', T.paper], ['--white', T.white], ['--ink', T.ink], ['--ink-2', T.ink2], ['--muted', T.muted], ['--ghost', T.ghost], ['--line', T.line],
  ['--black', T.black], ['--black-2', T.black2], ['--line-d', T.lineD], ['--muted-d', T.mutedD], ['--red', T.red],
  ['--ember-1', T.ember1], ['--ember-2', T.ember2], ['--ember-3', T.ember3], ['--good', T.good], ['--warn', T.warn], ['--bad', T.bad],
];

const TYPE: Array<[string, string, string]> = [
  ['display-xl', 't-display-xl', 'Brickell Digital'],
  ['display-l', 't-display-l', '73'],
  ['h1', 't-h1', 'We are creative technologists building visibility.'],
  ['statement', 't-statement', 'Two-tone statement paragraph.'],
  ['h2', 't-h2', 'Card and block titles'],
  ['h3', 't-h3', 'Seed Stage Program'],
  ['body', 'text-body', 'Paragraph text set in Inter at 14px with a comfortable 1.55 line height.'],
  ['small', 'text-small text-muted', 'Descriptions under titles.'],
  ['meta', 't-meta text-muted', 'Built for local businesses · Denver, CO'],
  ['mono-num', 't-mono text-[13px]', '1,850 · 91% · 11/12'],
];

export default function Styleguide() {
  const [tab, setTab] = useState<'a' | 'b'>('a');
  const [utab, setUtab] = useState<'x' | 'y' | 'z'>('x');
  const [sl, setSl] = useState(72);
  const [tags, setTags] = useState(['Drain Cleaning', 'Leak Detection']);
  const [chk, setChk] = useState(true);
  return (
    <div className="@container min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/[0.92] backdrop-blur-md">
        <div className="shell flex h-12 items-center justify-between">
          <div className="flex items-center gap-2.5 text-[12px] font-medium">
            <AgencyMark size={16} /> Rank Orbit · Styleguide
          </div>
          <nav className="flex items-center gap-6 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-red" />Primitives</span>
            <Link to="/styleguide/charts" className="text-ink-2 hover:text-ink">Charts</Link>
            <Link to="/demo" className="text-ink-2 hover:text-ink">Demo report</Link>
          </nav>
        </div>
      </header>

      <section className="shell band-y">
        <h1 className="t-display-xl">Rank Orbit</h1>
        <div className="mt-10 grid grid-cols-1 gap-6 @md:grid-cols-12">
          <p className="font-display text-[24px] font-medium tracking-[-0.02em] @md:col-span-7">Design system for the AI Visibility report</p>
          <p className="t-meta text-muted @md:col-span-5 @md:text-right">Swiss / editorial · zero radius · hairlines · one red accent</p>
        </div>
      </section>

      <section className="shell pb-24">
        <div className="mb-8 border-t border-line pt-5"><SectionLabel>Colors</SectionLabel></div>
        <div className="grid grid-cols-3 gap-px bg-line @md:grid-cols-6">
          {COLORS.map(([n, hex]) => (
            <div key={n} className="bg-paper p-3">
              <div className="h-14 border border-line" style={{ background: hex }} />
              <div className="mt-2 text-[11px]">{n}</div>
              <div className="t-mono text-[10.5px] text-muted">{hex}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="shell pb-24">
        <div className="mb-8 border-t border-line pt-5"><SectionLabel>Type scale</SectionLabel></div>
        <div className="flex flex-col">
          {TYPE.map(([name, cls, sample]) => (
            <div key={name} className="grid grid-cols-1 items-baseline gap-2 border-b border-line py-5 @md:grid-cols-12">
              <div className="t-meta t-mono text-muted @md:col-span-2">{name}</div>
              <div className={`${cls} @md:col-span-10`}>{sample}</div>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <Statement lead="This month we completed 78 optimization tasks for Summit Peak Plumbing." rest="NAP accuracy rose to 91%, entity strength reached 72%, and 11 of 12 directories now match your business data." />
        </div>
      </section>

      <section className="on-dark bg-black">
        <div className="shell band-y">
          <div className="mb-14 flex justify-between"><SectionLabel tone="dark">Ember card</SectionLabel><span className="t-meta text-muted-d">Hero band</span></div>
          <EmberHero left="Visibility" right="Authority" center={73} centerLabel="Score 73" />
          <div className="mt-16"><Statement tone="dark" lead="White on black for the first sentence." rest="Continuation in dark grey keeps the rhythm of the reference." /></div>
          <div className="mt-16 flex flex-wrap gap-4">
            <Button tone="dark">Book a call</Button>
            <Button tone="dark" variant="outline" arrow="up-right">Get started</Button>
            <TextLink to="/styleguide" tone="dark">View program</TextLink>
          </div>
          <div className="mt-16">
            <BlockTabs tone="dark" label="Audience" value={tab} onChange={setTab} items={[{ value: 'a', title: 'For Founders', description: 'Seed to Series B' }, { value: 'b', title: 'For Investors', description: 'Funds and angels' }]} />
          </div>
        </div>
      </section>

      <section className="shell band-y">
        <div className="mb-8 border-t border-line pt-5"><SectionLabel>Buttons & links</SectionLabel></div>
        <div className="flex flex-wrap items-center gap-4">
          <Button>Book a call</Button>
          <Button arrow="up-right">Get started</Button>
          <Button size="sm">Screenshot</Button>
          <Button variant="outline" arrow="none">Secondary</Button>
          <Button variant="danger" arrow="none">Delete</Button>
          <Button disabled>Disabled</Button>
          <TextLink to="/styleguide">View program</TextLink>
          <DisabledLink>View</DisabledLink>
        </div>

        <div className="mb-8 mt-24 border-t border-line pt-5"><SectionLabel>Tabs</SectionLabel></div>
        <BlockTabs label="Light block tabs" value={tab} onChange={setTab} items={[{ value: 'a', title: 'For Founders', description: 'Seed to Series B' }, { value: 'b', title: 'For Investors', description: 'Funds and angels' }]} />
        <UnderlineTabs className="mt-10" label="Underline tabs" value={utab} onChange={setUtab} items={[{ value: 'x', title: 'Venture Firms' }, { value: 'y', title: 'Startups' }, { value: 'z', title: 'Accelerators' }]} />

        <div className="mb-8 mt-24 border-t border-line pt-5"><SectionLabel>KPI blocks · deltas · chips</SectionLabel></div>
        <KpiRow cols={4}>
          <KpiBlock label="NAP Accuracy" value={91} unit="%" delta={4} deltaUnit=" pts" caption="vs last month" aside={<Sparkline values={[58, 67, 75, 87, 91]} max={100} />} />
          <KpiBlock label="Entity Strength" value={72} unit="%" delta={-2} deltaUnit=" pts" caption="vs last month" />
          <KpiBlock label="Listings" value={11} unit="/12" delta={0} caption="vs last month" />
          <KpiBlock label="Brand Mentions" value={27} delta={null} caption="first month" />
        </KpiRow>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <DeltaBadge value={4} unit=" pts" /><DeltaBadge value={-2} unit=" pts" /><DeltaBadge value={0} /><DeltaBadge value={null} />
          <SourceStatusChip status="verified" /><SourceStatusChip status="synced" /><SourceStatusChip status="progress" /><SourceStatusChip status="queued" />
          <StatusChip tone="good">Consistent</StatusChip><StatusChip tone="warn">Being aligned</StatusChip>
        </div>
        <div className="mt-10 max-w-md"><ProgressBar value={62} label="Progress" /><div className="h-4" /><ProgressBar value={40} accent height={6} label="Accent" /></div>

        <div className="mb-8 mt-24 border-t border-line pt-5"><SectionLabel>Index table</SectionLabel></div>
        <IndexTable
          caption="Clients"
          rows={[
            { y: 2026, c: 'Summit Peak Plumbing', i: 'Plumbing' },
            { y: 2026, c: 'Harbor Line Dental', i: 'Dental' },
            { y: 2025, c: 'Crestline Roofing', i: 'Roofing' },
          ]}
          rowKey={(r) => r.c}
          highlight={(_, i) => i === 0}
          columns={[
            { key: 'y', header: 'Year', render: (r) => <span className="t-mono">{r.y}</span>, width: '90px' },
            { key: 'c', header: 'Client', render: (r) => r.c },
            { key: 'i', header: 'Industry', render: (r) => <span className="text-ink-2">{r.i}</span> },
            { key: 'v', header: '', align: 'right', render: () => <TextLink to="/styleguide" arrow="right">View</TextLink>, className: 'pr-0' },
          ]}
        />

        <div className="mb-8 mt-24 border-t border-line pt-5"><SectionLabel>Logo strip & visual card</SectionLabel></div>
        <LogoStrip label="Tracked across" names={TRACKED_ON} />
        <div className="mt-12 grid grid-cols-1 gap-6 @md:grid-cols-3">
          <VisualCard title="Skybound Systems" meta="Seed · $10M led by Lightspeed"><div className="aspect-[4/3] bg-paper" /></VisualCard>
          <VisualCard title="Northwind Labs" meta="Series A"><div className="aspect-[4/3]" style={{ background: `radial-gradient(120% 90% at 50% 0%, ${T.ember3}, ${T.ember2} 45%, ${T.ember1})` }} /></VisualCard>
        </div>

        <div className="mb-8 mt-24 border-t border-line pt-5"><SectionLabel>Form controls (admin)</SectionLabel></div>
        <div className="grid max-w-3xl grid-cols-1 gap-6 @md:grid-cols-2">
          <TextInput label="Business name" defaultValue="Summit Peak Plumbing & Drain" />
          <SelectInput label="Status" defaultValue="verified"><option value="verified">Verified</option><option value="queued">Queued</option></SelectInput>
          <Slider label="NAP Accuracy" value={sl} onChange={setSl} />
          <TagInput label="Services" value={tags} onChange={setTags} />
          <div className="flex items-center gap-6"><Checkbox label="Closed" checked={chk} onChange={setChk} /><Toggle label="Published" checked={chk} onChange={setChk} /></div>
        </div>
      </section>
    </div>
  );
}
