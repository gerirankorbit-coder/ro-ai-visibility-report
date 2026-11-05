import { useId } from 'react';
import { clamp, readinessLevel } from '@/lib/metrics';
import { FONT, T } from '@/lib/tokens';
import { arcPath, polar } from './arc';
import { ChartFrame, fx, useTheme, type Tone } from './common';

/** Semicircle gauge (0–100) with ticks, butt-capped arc and centered value. */
export function Gauge({ value, label = 'AI Readiness score', tone = 'light', width = 320 }: { value: number; label?: string; tone?: Tone; width?: number }) {
  const th = useTheme(tone);
  const gid = `g-${useId().replace(/:/g, '')}`;
  const W = 320;
  const H = 188;
  const cx = 160;
  const cy = 164;
  const r = 128;
  const v = clamp(value);
  const d = arcPath(cx, cy, r, -90, -90 + (v / 100) * 180);
  return (
    <ChartFrame width={W} height={H} label={`${label}: ${Math.round(v)} out of 100 (${readinessLevel(v)})`} maxWidth={width} table={{ caption: label, headers: ['Measure', 'Value'], rows: [[label, Math.round(v)]] }}>
      {Array.from({ length: 11 }, (_, t) => {
        const deg = -90 + t * 18;
        const [x1, y1] = polar(cx, cy, r + 12, deg);
        const [x2, y2] = polar(cx, cy, r + (t % 5 ? 16 : 20), deg);
        return <line key={t} x1={fx(x1)} y1={fx(y1)} x2={fx(x2)} y2={fx(y2)} stroke={th.axis} strokeWidth={1} />;
      })}
      <defs>
        <linearGradient id={gid} x1={cx - r} x2={cx + r} y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={T.cyan} />
          <stop offset="1" stopColor={T.accent} />
        </linearGradient>
      </defs>
      <path d={arcPath(cx, cy, r, -90, 90)} fill="none" stroke={th.track} strokeWidth={18} />
      {d ? <path className="draw" pathLength={1} d={d} fill="none" stroke={`url(#${gid})`} strokeWidth={18} strokeLinecap="butt" shapeRendering="geometricPrecision" /> : null}
      {(() => {
        const [ex, ey] = polar(cx, cy, r, -90 + (v / 100) * 180);
        return <circle cx={fx(ex)} cy={fx(ey)} r={6} fill="#fff" stroke={T.ink} strokeWidth={2} />;
      })()}
      <text x={cx} y={cy - 18} textAnchor="middle" fontSize={64} fontFamily={FONT.display} fontWeight={700} letterSpacing="-2px" fill={th.text} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(v)}
      </text>
      <text x={cx - r} y={cy + 20} textAnchor="middle" fontSize={10.5} fill={th.axis} fontFamily={FONT.mono}>
        0
      </text>
      <text x={cx + r} y={cy + 20} textAnchor="middle" fontSize={10.5} fill={th.axis} fontFamily={FONT.mono}>
        100
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize={10.5} fill={th.axis} fontFamily={FONT.mono}>
        out of 100
      </text>
    </ChartFrame>
  );
}
