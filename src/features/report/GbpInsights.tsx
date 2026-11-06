import type { ReactNode } from 'react';
import { DAY_NAMES, type GbpSummary } from '@/types/schema';

/**
 * Views / Actions / Phone calls charts drawn like the BrightLocal insights panels.
 * Colours sampled from the BrightLocal screenshot. Panel size 651 x 181 CSS px.
 */
export const INS = {
  green: { fill: '#85C994', line: '#5FAE73' },
  yellow: { fill: '#E9E083', line: '#D2C53C' },
  blue: { fill: '#9B9CC3', line: '#6F6FA6' },
  violet: { fill: '#C79CF1', line: '#A86FE0' },
  bar: '#D3C006',
  panel: '#F8F8F8',
  grid: '#DFDFDF',
  axis: '#555555',
};

const FONT = "'Open Sans', 'Segoe UI', sans-serif";
const PW = 651;
const PH = 181;

interface Series {
  name: string;
  c: { fill: string; line: string };
  values: number[];
}

const sum = (v: number[]) => v.reduce((a, b) => a + b, 0);

/** Integer axis like BrightLocal: step from 1, 2, 5, 10, 20, 50… with at most 5 intervals. */
export function axis(dataMax: number): { max: number; ticks: number[] } {
  const m = Math.max(1, dataMax);
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
  const step = steps.find((st) => Math.ceil(m / st) <= 5) ?? Math.pow(10, Math.ceil(Math.log10(m / 5)));
  const max = step * Math.ceil(m / step);
  return { max, ticks: Array.from({ length: max / step + 1 }, (_, i) => i * step) };
}
/** 1410 -> "1.41k", like BrightLocal. */
export const kFmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(2).replace(/\.?0+$/, '')}k` : String(n));

function InfoDot() {
  return (
    <g>
      <circle r={3.2} fill="#2A2A8C" />
      <text y={1.9} fontSize={4.6} fontWeight={700} fill="#fff" textAnchor="middle" fontFamily={FONT}>
        i
      </text>
    </g>
  );
}

function Panel({ title, info = false, children, label }: { title: string; info?: boolean; children: ReactNode; label: string }) {
  return (
    <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label={label} style={{ display: 'block', background: INS.panel }}>
      <text x={8} y={22} fontFamily="'Montserrat Variable', Montserrat, sans-serif" fontSize={9.5} fontWeight={700} fill="#111">
        {title}
      </text>
      {info ? (
        <g transform={`translate(${12 + title.length * 5.6}, 16)`}>
          <InfoDot />
        </g>
      ) : null}
      {children}
    </svg>
  );
}

/** Overlapping translucent area chart (series drawn back to front) with a totals legend on the right. */
function AreaPanel({ title, totalLabel, labels, series, info, legend }: { title: string; totalLabel: string; labels: string[]; series: Series[]; info?: boolean; legend?: string[] }) {
  const legendSeries = legend ? legend.map((n) => series.find((s) => s.name === n)!).filter(Boolean) : series;
  const x0 = 33;
  const x1 = 555;
  const yTop = 41;
  const yBase = 154;
  const n = Math.max(1, labels.length);
  const { max, ticks } = axis(Math.max(...series.flatMap((s) => s.values), 1));
  const x = (i: number) => (n < 2 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (n - 1));
  const y = (v: number) => yBase - ((yBase - yTop) * v) / max;
  const step = n > 16 ? 2 : 1;
  const total = sum(series.map((s) => sum(s.values)));
  return (
    <Panel title={title} info={info} label={`${title}: ${totalLabel} ${total}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x0} x2={x1} y1={Math.round(y(t)) + 0.5} y2={Math.round(y(t)) + 0.5} stroke={INS.grid} strokeWidth={0.8} shapeRendering="crispEdges" />
          <text x={x0 - 6} y={y(t) + 2} fontSize={5.3} fill={INS.axis} textAnchor="end" fontFamily={FONT}>
            {t}
          </text>
        </g>
      ))}
      {series.map((s) => {
        if (n < 2) return <rect key={s.name} x={x(0) - 4} y={y(s.values[0] ?? 0)} width={8} height={yBase - y(s.values[0] ?? 0)} fill={s.c.fill} fillOpacity={0.8} stroke={s.c.line} strokeWidth={0.6} />;
        const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
        return <polygon key={s.name} points={`${x(0).toFixed(1)},${yBase} ${pts} ${x(n - 1).toFixed(1)},${yBase}`} fill={s.c.fill} fillOpacity={0.78} stroke={s.c.line} strokeOpacity={0.7} strokeWidth={0.6} strokeLinejoin="round" />;
      })}
      {labels.map((l, i) =>
        i % step === 0 ? (
          <text key={i} x={x(i)} y={yBase + 10} fontSize={4.9} fill={INS.axis} textAnchor="middle" fontFamily={FONT}>
            {l}
          </text>
        ) : null,
      )}
      <text x={574} y={49} fontSize={7.4} fontWeight={600} fill="#111" fontFamily={FONT}>
        {totalLabel}: {kFmt(total)}
      </text>
      {legendSeries.map((s, i) => (
        <g key={s.name} transform={`translate(574, ${60 + i * 26})`}>
          <rect width={13} height={13} rx={2} fill={s.c.fill} stroke={s.c.line} strokeWidth={0.8} />
          <text x={20} y={6.5} fontSize={6.8} fontWeight={600} fill="#111" fontFamily={FONT}>
            {s.name}
          </text>
          <text x={20} y={14.8} fontSize={6.8} fontWeight={600} fill="#111" fontFamily={FONT}>
            {kFmt(sum(s.values))}
          </text>
        </g>
      ))}
    </Panel>
  );
}

function CallsPanel({ calls }: { calls: number[] }) {
  const x0 = 33;
  const x1 = 640;
  const yTop = 41;
  const yBase = 154;
  const { max, ticks } = axis(Math.max(3, ...calls));
  const col = (x1 - x0) / 7;
  const y = (v: number) => yBase - ((yBase - yTop) * v) / max;
  return (
    <Panel title="Phone calls" label={`Phone calls: ${sum(calls)} total`}>
      <text x={640} y={22} fontSize={6.2} fill="#111" textAnchor="end" fontFamily={FONT}>
        Total Calls {sum(calls)}
      </text>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x0} x2={x1} y1={Math.round(y(t)) + 0.5} y2={Math.round(y(t)) + 0.5} stroke={INS.grid} strokeWidth={0.8} shapeRendering="crispEdges" />
          <text x={x0 - 6} y={y(t) + 2} fontSize={5.3} fill={INS.axis} textAnchor="end" fontFamily={FONT}>
            {t}
          </text>
        </g>
      ))}
      {calls.map((c, i) => (
        <g key={i}>
          {c > 0 ? <rect x={x0 + col * i + col * 0.15} y={y(c)} width={col * 0.7} height={yBase - y(c)} fill={INS.bar} shapeRendering="crispEdges" /> : null}
          <text x={x0 + col * i + col / 2} y={yBase + 10} fontSize={5.3} fill={INS.axis} textAnchor="middle" fontFamily={FONT}>
            {DAY_NAMES[i]}
          </text>
        </g>
      ))}
    </Panel>
  );
}

function FilterPill({ text }: { text: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 19, padding: '0 7px', border: '1px solid #222', borderRadius: 10, fontFamily: FONT, fontSize: 7.4, color: '#111', background: '#fff' }}>
      <svg width={7} height={7} viewBox="0 0 8 8" aria-hidden>
        <path d="M.5 1h7L4.8 4.3V7L3.2 6.2V4.3z" fill="#111" />
      </svg>
      {text}
      <svg width={7} height={7} viewBox="0 0 8 8" aria-hidden>
        <path d="M1.5 3 4 5.5 6.5 3" fill="none" stroke="#111" strokeWidth={1.1} />
      </svg>
    </span>
  );
}

/** "Last Updated" row + the three insight panels (placed under the Summary tiles). */
export function GbpInsights({ data }: { data: GbpSummary }) {
  return (
    <div style={{ position: 'absolute', left: 14, top: 196, width: PW }}>
      <div style={{ height: 47, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 9, paddingTop: 4 }}>
        {data.updated ? (
          <span style={{ fontFamily: FONT, fontSize: 7, color: '#111' }}>
            Last Updated: <b style={{ fontWeight: 600 }}>{data.updated}</b>
          </span>
        ) : null}
        {data.range ? <FilterPill text={data.range} /> : null}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <AreaPanel
          title="Views"
          info
          totalLabel="Total Views"
          labels={data.views.map((r) => r.date)}
          series={[
            { name: 'Search - Mobile', c: INS.yellow, values: data.views.map((r) => r.sm) },
            { name: 'Maps - Mobile', c: INS.violet, values: data.views.map((r) => r.mm) },
            { name: 'Search - Desktop', c: INS.green, values: data.views.map((r) => r.sd) },
            { name: 'Maps - Desktop', c: INS.blue, values: data.views.map((r) => r.md) },
          ]}
          legend={['Search - Desktop', 'Search - Mobile', 'Maps - Desktop', 'Maps - Mobile']}
        />
        <AreaPanel
          title="Actions"
          totalLabel="Total Actions"
          labels={data.actions.map((r) => r.date)}
          series={[
            { name: 'Request direction', c: INS.yellow, values: data.actions.map((r) => r.dir) },
            { name: 'Website clicks', c: INS.green, values: data.actions.map((r) => r.web) },
            { name: 'Call you', c: INS.blue, values: data.actions.map((r) => r.call) },
          ]}
          legend={['Website clicks', 'Request direction', 'Call you']}
        />
        <CallsPanel calls={data.calls} />
      </div>
    </div>
  );
}
