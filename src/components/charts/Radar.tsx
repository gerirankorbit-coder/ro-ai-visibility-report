import { clamp } from '@/lib/metrics';
import { FONT } from '@/lib/tokens';
import { ChartFrame, fx, useTheme, useTip, type Tone } from './common';

export interface RadarAxis {
  key: string;
  label: string;
}

/** Hexagonal radar: current polygon (ink 10% fill, 1.5px stroke, red square vertices) vs previous (dashed grey). */
export function Radar({
  axes,
  current,
  previous,
  label,
  tone = 'light',
  currentName = 'Current',
  previousName = 'Previous',
}: {
  axes: RadarAxis[];
  current: Record<string, number>;
  previous?: Record<string, number> | null;
  label: string;
  tone?: Tone;
  currentName?: string;
  previousName?: string;
}) {
  const th = useTheme(tone);
  const [tip, setTip] = useTip();
  const W = 520;
  const H = 360;
  const cx = W / 2;
  const cy = H / 2;
  const R = 124;
  const N = axes.length;
  const ang = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / N;
  const pt = (i: number, v: number): [number, number] => [cx + ((R * v) / 100) * Math.cos(ang(i)), cy + ((R * v) / 100) * Math.sin(ang(i))];
  const poly = (o: Record<string, number>) => axes.map((a, i) => pt(i, clamp(o[a.key] ?? 0)).map(fx).join(',')).join(' ');

  return (
    <ChartFrame
      width={W}
      height={H}
      label={label}
      tip={tip}
      maxWidth={560}
      className="mx-auto"
      table={{
        caption: label,
        headers: ['Signal', currentName, ...(previous ? [previousName] : [])],
        rows: axes.map((a) => [a.label, `${current[a.key] ?? 0}%`, ...(previous ? [`${previous[a.key] ?? 0}%`] : [])]),
      }}
    >
      {[25, 50, 75, 100].map((l) => (
        <polygon key={l} points={axes.map((_, i) => pt(i, l).map(fx).join(',')).join(' ')} fill="none" stroke={th.grid} strokeWidth={1} />
      ))}
      {axes.map((a, i) => {
        const [x2, y2] = pt(i, 100);
        return <line key={a.key} x1={cx} y1={cy} x2={fx(x2)} y2={fx(y2)} stroke={th.grid} strokeWidth={1} />;
      })}
      {previous ? <polygon className="fade" points={poly(previous)} fill="none" stroke={th.compare} strokeWidth={1} strokeDasharray="4 3" /> : null}
      <polygon className="fade" points={poly(current)} fill={th.main} fillOpacity={0.1} stroke={th.main} strokeWidth={1.5} strokeLinejoin="miter" />
      {axes.map((a, i) => {
        const v = clamp(current[a.key] ?? 0);
        const [x, y] = pt(i, v);
        return (
          <rect
            key={a.key}
            x={fx(x - 3)}
            y={fx(y - 3)}
            width={6}
            height={6}
            fill={th.accent}
            onMouseEnter={() => setTip({ x, y, lines: [a.label, `${currentName}: ${v}%`, ...(previous ? [`${previousName}: ${previous[a.key] ?? 0}%`] : [])] })}
            onMouseLeave={() => setTip(null)}
          />
        );
      })}
      {axes.map((a, i) => {
        const c = Math.cos(ang(i));
        const s = Math.sin(ang(i));
        const lx = cx + (R + 18) * c;
        const ly = cy + (R + 18) * s;
        const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end';
        const dy = s > 0.5 ? 12 : s < -0.5 ? -6 : 4;
        return (
          <text key={a.key} x={fx(lx)} y={fx(ly + dy)} textAnchor={anchor} fontSize={11} fontFamily={FONT.sans} fill={th.text}>
            {a.label}
            <tspan fill={th.axis} fontFamily={FONT.mono} fontSize={10.5}>
              {`  ${current[a.key] ?? 0}%`}
            </tspan>
          </text>
        );
      })}
    </ChartFrame>
  );
}
