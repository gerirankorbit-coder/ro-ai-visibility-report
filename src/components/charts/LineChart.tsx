import { useId } from 'react';
import { FONT } from '@/lib/tokens';
import { ChartFrame, GridY, Marker, fx, snap, useTheme, useTip, type Tone } from './common';

export interface LineSeries {
  name: string;
  values: number[];
  /** 'main' | 'accent' | 'compare' | 's3' | 's4' or an explicit hex. */
  color?: 'main' | 'accent' | 'compare' | 's3' | 's4' | `#${string}`;
  dash?: string;
  shape?: 'square' | 'circle' | 'triangle';
  area?: boolean;
}

export function LineChart({
  labels,
  series,
  max = 100,
  width = 760,
  height = 280,
  label,
  fmt = (v) => String(Math.round(v)),
  tone = 'light',
}: {
  labels: string[];
  series: LineSeries[];
  max?: number;
  width?: number;
  height?: number;
  label: string;
  fmt?: (v: number) => string;
  tone?: Tone;
}) {
  const th = useTheme(tone);
  const uid = useId().replace(/:/g, '');
  const [tip, setTip] = useTip();
  const pl = 44;
  const pr = 16;
  const pt = 14;
  const pb = 30;
  const iw = width - pl - pr;
  const ih = height - pt - pb;
  const n = labels.length;
  const x = (i: number) => (n < 2 ? pl + iw / 2 : pl + (iw * i) / (n - 1));
  const y = (v: number) => pt + ih * (1 - Math.max(0, Math.min(max, v)) / max);
  const colorOf = (s: LineSeries) => (s.color?.startsWith('#') ? s.color : th[(s.color as 'main') ?? 'main']);
  const bandW = n < 2 ? iw : iw / (n - 1);

  return (
    <ChartFrame
      width={width}
      height={height}
      label={label}
      tip={tip}
      table={{ caption: label, headers: ['Month', ...series.map((s) => s.name)], rows: labels.map((l, i) => [l, ...series.map((s) => fmt(s.values[i] ?? 0))]) }}
    >
      <defs>
        <linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={th.main} stopOpacity={0.14} />
          <stop offset="1" stopColor={th.main} stopOpacity={0} />
        </linearGradient>
      </defs>
      <GridY x0={pl} x1={width - pr} y={y} max={max} theme={th} fmt={fmt} />
      {labels.map((l, i) => (
        <text key={l + i} x={fx(x(i))} y={height - 8} textAnchor="middle" fontSize={10.5} fill={th.axis} fontFamily={FONT.mono}>
          {l}
        </text>
      ))}
      {tip ? <line x1={snap(tip.x)} x2={snap(tip.x)} y1={pt} y2={pt + ih} stroke={th.axis} strokeWidth={1} strokeDasharray="2 3" shapeRendering="crispEdges" className="chart-tip" /> : null}
      {series.map((s, si) => {
        const c = colorOf(s);
        const pts = s.values.map((v, i) => [x(i), y(v)] as const);
        const d = pts.map((p, i) => `${i ? 'L' : 'M'}${fx(p[0])} ${fx(p[1])}`).join(' ');
        return (
          <g key={s.name}>
            {s.area && n > 1 ? <path className="fade" d={`${d} L${fx(pts[n - 1]![0])} ${fx(y(0))} L${fx(pts[0]![0])} ${fx(y(0))} Z`} fill={`url(#area-${uid})`} /> : null}
            {n > 1 ? (
              <path
                className={s.dash ? 'fade' : 'draw'}
                pathLength={s.dash ? undefined : 1}
                d={d}
                fill="none"
                stroke={c}
                strokeWidth={2.25}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={s.dash}
                shapeRendering="geometricPrecision"
                style={{ animationDelay: `${si * 80}ms` }}
              />
            ) : null}
            {pts.map((p, i) => (
              <Marker key={i} x={p[0]} y={p[1]} current={i === n - 1} color={c} accent={c === th.compare || c === th.s3 || c === th.s4 ? c : th.accent} bg={th.bg} shape={s.shape} />
            ))}
          </g>
        );
      })}
      {labels.map((l, i) => (
        <rect
          key={`hit-${i}`}
          x={fx(x(i) - bandW / 2)}
          y={pt}
          width={fx(bandW)}
          height={ih}
          fill="transparent"
          onMouseEnter={() =>
            setTip({
              x: x(i),
              y: Math.min(...series.map((s) => y(s.values[i] ?? 0))),
              lines: [l, ...series.map((s) => `${s.name}: ${fmt(s.values[i] ?? 0)}`)],
            })
          }
          onMouseLeave={() => setTip(null)}
        />
      ))}
    </ChartFrame>
  );
}
