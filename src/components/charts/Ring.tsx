import { useId, type ReactNode } from 'react';
import { clamp } from '@/lib/metrics';
import { FONT, T } from '@/lib/tokens';
import { arcPath } from './arc';
import { ChartFrame, useTheme, type Tone } from './common';

/** Ring: 1.5px track + thick butt-capped arc, value centered (Inter Tight). */
export function Ring({
  value,
  size = 168,
  stroke = 12,
  label,
  center,
  sub,
  tone = 'light',
  accent = false,
  fontSize,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  center?: ReactNode;
  sub?: string;
  tone?: Tone;
  accent?: boolean;
  fontSize?: number;
}) {
  const th = useTheme(tone);
  const gid = `r-${useId().replace(/:/g, '')}`;
  const c = size / 2;
  const r = c - stroke / 2 - 1;
  const pct = clamp(value);
  const d = arcPath(c, c, r, 0, (pct / 100) * 360);
  const fs = fontSize ?? Math.round(size * 0.24);
  return (
    <ChartFrame width={size} height={size} label={label} maxWidth={size} table={{ caption: label, headers: ['Measure', 'Value'], rows: [[label, `${Math.round(pct)}%`]] }}>
      <defs>
        <linearGradient id={gid} x1="0" x2={size} y1="0" y2={size} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={T.cyan} />
          <stop offset="1" stopColor={T.accent} />
        </linearGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill="none" stroke={th.track} strokeWidth={stroke} />
      {d ? <path className="draw" pathLength={1} d={d} fill="none" stroke={accent ? th.accent : `url(#${gid})`} strokeWidth={stroke} strokeLinecap="butt" shapeRendering="geometricPrecision" /> : null}
      <text x={c} y={sub ? c + fs * 0.18 : c + fs * 0.34} textAnchor="middle" fontSize={fs} fill={th.text} fontFamily={FONT.display} fontWeight={700} letterSpacing={`${-0.02 * fs}px`} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {center ?? `${Math.round(pct)}%`}
      </text>
      {sub ? (
        <text x={c} y={c + fs * 0.18 + 18} textAnchor="middle" fontSize={10.5} fill={th.axis} fontFamily={FONT.mono}>
          {sub}
        </text>
      ) : null}
    </ChartFrame>
  );
}
