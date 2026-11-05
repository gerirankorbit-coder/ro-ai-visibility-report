import { useId } from 'react';
import { niceMax } from '@/lib/metrics';
import { FONT } from '@/lib/tokens';
import { ChartFrame, GridY, fx, snap, useTheme, useTip, type Tone } from './common';

export const BAR_FILLS = (tone: Tone) => {
  const dark = tone === 'dark';
  return [dark ? '#FFFFFF' : '#0A0A0A', '#E1251B', '#6E6E6E', dark ? '#4A4A4A' : '#B5B5B5'];
};

/** Stacked square-ended bars, 2px gap between segments, total label above. */
export function StackedBars({
  labels,
  categories,
  rows,
  width = 760,
  height = 280,
  label,
  tone = 'light',
  currentIndex,
}: {
  labels: string[];
  categories: string[];
  rows: number[][];
  width?: number;
  height?: number;
  label: string;
  tone?: Tone;
  currentIndex?: number;
}) {
  const th = useTheme(tone);
  const uid = useId().replace(/:/g, '');
  const [tip, setTip] = useTip();
  const fills = BAR_FILLS(tone);
  const pl = 40;
  const pr = 8;
  const pt = 22;
  const pb = 30;
  const iw = width - pl - pr;
  const ih = height - pt - pb;
  const n = labels.length;
  const totals = rows.map((r) => r.reduce((a, b) => a + b, 0));
  const max = niceMax(Math.max(1, ...totals));
  const bw = Math.min(56, (iw / Math.max(1, n)) * 0.46);
  const cx = (i: number) => pl + (iw * (i + 0.5)) / Math.max(1, n);
  const y = (v: number) => pt + ih * (1 - v / max);

  return (
    <ChartFrame
      width={width}
      height={height}
      label={label}
      tip={tip}
      table={{ caption: label, headers: ['Month', ...categories, 'Total'], rows: labels.map((l, i) => [l, ...(rows[i] ?? []), totals[i] ?? 0]) }}
    >
      <defs>
        <pattern id={`hatch-${uid}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="4" height="4" fill={fills[2]} />
          <line x1="0" y1="0" x2="0" y2="4" stroke={tone === 'dark' ? '#000' : '#FFFFFF'} strokeWidth="1.2" />
        </pattern>
      </defs>
      <GridY x0={pl} x1={width - pr} y={y} max={max} theme={th} />
      {rows.map((r, i) => {
        let acc = 0;
        const x0 = snap(cx(i) - bw / 2) - 0.5;
        const segs = r.map((v, ci) => {
          if (!v) return null;
          const y0 = y(acc);
          const y1 = y(acc + v);
          acc += v;
          const top = Math.round(y1);
          const h = Math.max(0, Math.round(y0) - top - 2);
          return (
            <rect
              key={ci}
              x={x0}
              y={top}
              width={Math.round(bw)}
              height={h}
              fill={ci === 2 ? `url(#hatch-${uid})` : fills[ci % fills.length]}
              shapeRendering="crispEdges"
              className="fade"
              onMouseEnter={() => setTip({ x: cx(i), y: top, lines: [labels[i] ?? '', `${categories[ci]}: ${v}`] })}
              onMouseLeave={() => setTip(null)}
            />
          );
        });
        return (
          <g key={i}>
            {segs}
            <text x={fx(cx(i))} y={fx(y(totals[i] ?? 0) - 7)} textAnchor="middle" fontSize={11} fill={th.text} fontFamily={FONT.mono}>
              {totals[i]}
            </text>
            <text x={fx(cx(i))} y={height - 8} textAnchor="middle" fontSize={10.5} fill={i === currentIndex ? th.text : th.axis} fontFamily={FONT.mono}>
              {labels[i]}
            </text>
            {i === currentIndex ? <rect x={fx(cx(i) - 3)} y={height - 3} width={6} height={3} fill={th.accent} /> : null}
          </g>
        );
      })}
    </ChartFrame>
  );
}
