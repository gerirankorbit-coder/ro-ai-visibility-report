import { niceMax } from '@/lib/metrics';
import { DAY_NAMES } from '@/types/schema';
import { BODY_FONT } from './layout';

/** Colors sampled from the BrightLocal / GBP insight charts in the sample report. */
export const INSIGHT_COLORS = {
  green: '#6DBB6D',
  yellow: '#D9CC2C',
  blue: '#6F6FB8',
  violet: '#C38BEA',
  bar: '#D3C006',
};

interface Series {
  name: string;
  color: string;
  values: number[];
}

const total = (v: number[]) => v.reduce((a, b) => a + b, 0);

/** Overlapping translucent area chart with a totals legend on the right (Views / Actions). */
export function AreaPanel({ title, totalLabel, labels, series, height = 187 }: { title: string; totalLabel: string; labels: string[]; series: Series[]; height?: number }) {
  const W = 680;
  const H = height;
  const pl = 22;
  const pt = 34;
  const pb = 22;
  const lw = 104; // legend width
  const iw = W - pl - lw - 10;
  const ih = H - pt - pb;
  const n = Math.max(1, labels.length);
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const x = (i: number) => pl + (n < 2 ? iw / 2 : (iw * i) / (n - 1));
  const y = (v: number) => pt + ih * (1 - v / max);
  const step = Math.max(1, Math.ceil(n / 15));
  const sum = series.reduce((a, s) => a + total(s.values), 0);
  return (
    <div style={{ background: '#F8F8F8', height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`${title}: ${sum} total`} style={{ display: 'block', fontFamily: BODY_FONT }}>
        <text x={10} y={20} fontSize={10.5} fontWeight={700} fill="#111">
          {title}
        </text>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={pl} x2={pl + iw} y1={Math.round(y(max * t)) + 0.5} y2={Math.round(y(max * t)) + 0.5} stroke="#E2E2E2" strokeWidth={1} shapeRendering="crispEdges" />
            <text x={pl - 5} y={y(max * t) + 2.5} fontSize={6} fill="#777" textAnchor="end">
              {Math.round(max * t)}
            </text>
          </g>
        ))}
        {series.map((s) => {
          if (n < 2) return <rect key={s.name} x={x(0) - 3} y={y(s.values[0] ?? 0)} width={6} height={Math.max(0, pt + ih - y(s.values[0] ?? 0))} fill={s.color} />;
          const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
          return <polygon key={s.name} points={`${x(0)},${pt + ih} ${pts} ${x(n - 1)},${pt + ih}`} fill={s.color} fillOpacity={0.62} stroke={s.color} strokeWidth={0.8} />;
        })}
        {labels.map((l, i) =>
          i % step === 0 ? (
            <text key={i} x={x(i)} y={H - 8} fontSize={5.5} fill="#777" textAnchor="middle">
              {l}
            </text>
          ) : null,
        )}
        <text x={W - lw} y={pt + 6} fontSize={7.5} fontWeight={700} fill="#111">
          {totalLabel}: {sum}
        </text>
        {series.map((s, i) => (
          <g key={s.name} transform={`translate(${W - lw}, ${pt + 18 + i * 27})`}>
            <rect width={11} height={11} fill={s.color} stroke="#666" strokeWidth={0.4} />
            <text x={16} y={6} fontSize={6.5} fill="#111">
              {s.name}
            </text>
            <text x={16} y={14.5} fontSize={6.5} fill="#111" fontWeight={700}>
              {total(s.values)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Phone calls by weekday. */
export function CallsPanel({ calls, height = 187 }: { calls: number[]; height?: number }) {
  const W = 680;
  const H = height;
  const pl = 22;
  const pt = 34;
  const pb = 22;
  const iw = W - pl - 30;
  const ih = H - pt - pb;
  const max = Math.max(4, ...calls);
  const col = iw / 7;
  const y = (v: number) => pt + ih * (1 - v / max);
  return (
    <div style={{ background: '#F8F8F8', height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`Phone calls: ${total(calls)} total`} style={{ display: 'block', fontFamily: BODY_FONT }}>
        <text x={10} y={20} fontSize={10.5} fontWeight={700} fill="#111">
          Phone calls
        </text>
        <text x={W - 12} y={20} fontSize={6.5} fill="#111" textAnchor="end">
          Total Calls {total(calls)}
        </text>
        {Array.from({ length: 5 }, (_, t) => (
          <g key={t}>
            <line x1={pl} x2={pl + iw} y1={Math.round(y((max * t) / 4)) + 0.5} y2={Math.round(y((max * t) / 4)) + 0.5} stroke="#E2E2E2" strokeWidth={1} shapeRendering="crispEdges" />
            <text x={pl - 5} y={y((max * t) / 4) + 2.5} fontSize={6} fill="#777" textAnchor="end">
              {Math.round((max * t) / 4)}
            </text>
          </g>
        ))}
        {calls.map((c, i) => (
          <g key={i}>
            {c > 0 ? <rect x={pl + col * i + col * 0.3} y={y(c)} width={col * 0.4} height={pt + ih - y(c)} fill={INSIGHT_COLORS.bar} shapeRendering="crispEdges" /> : null}
            <text x={pl + col * i + col / 2} y={H - 8} fontSize={5.5} fill="#777" textAnchor="middle">
              {DAY_NAMES[i]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
