import { FONT } from '@/lib/tokens';
import { ChartFrame, fx, useTheme, useTip, type Tone } from './common';

/** Horizontal funnel: stages left → right, bar height ∝ value, connected by soft trapezoids. */
export function Funnel({ steps, label, tone = 'light', width = 560, height = 240 }: { steps: Array<{ label: string; value: number }>; label: string; tone?: Tone; width?: number; height?: number }) {
  const th = useTheme(tone);
  const [tip, setTip] = useTip();
  const n = steps.length;
  const pt = 40;
  const pb = 34;
  const ih = height - pt - pb;
  const max = Math.max(1, ...steps.map((s) => s.value));
  const colW = width / n;
  const bw = Math.min(64, colW * 0.34);
  const cy = pt + ih / 2;
  const h = (v: number) => Math.max(2, (ih * v) / max);
  const fills = [th.main, th.s3, th.accent];
  return (
    <ChartFrame width={width} height={height} label={label} tip={tip} table={{ caption: label, headers: ['Stage', 'Profiles'], rows: steps.map((s) => [s.label, s.value]) }}>
      {steps.slice(0, -1).map((s, i) => {
        const nx = steps[i + 1]!;
        const x0 = colW * (i + 0.5) + bw / 2;
        const x1 = colW * (i + 1.5) - bw / 2;
        const h0 = h(s.value);
        const h1 = h(nx.value);
        return <path key={i} className="fade" d={`M${fx(x0)} ${fx(cy - h0 / 2)}L${fx(x1)} ${fx(cy - h1 / 2)}L${fx(x1)} ${fx(cy + h1 / 2)}L${fx(x0)} ${fx(cy + h0 / 2)}Z`} fill={th.main} fillOpacity={0.06} />;
      })}
      {steps.map((s, i) => {
        const x = colW * (i + 0.5);
        const hh = h(s.value);
        return (
          <g key={s.label}>
            <rect
              x={fx(x - bw / 2)}
              y={fx(cy - hh / 2)}
              width={fx(bw)}
              height={fx(hh)}
              fill={fills[i % fills.length]}
              shapeRendering="crispEdges"
              className="fade"
              onMouseEnter={() => setTip({ x, y: cy - hh / 2, lines: [s.label, `${s.value} profiles`] })}
              onMouseLeave={() => setTip(null)}
            />
            <text x={fx(x)} y={22} textAnchor="middle" fontSize={26} fontFamily={FONT.display} fontWeight={500} letterSpacing="-1.2px" fill={th.text}>
              {s.value}
            </text>
            <text x={fx(x)} y={height - 10} textAnchor="middle" fontSize={10.5} fontFamily={FONT.mono} fill={th.axis}>
              {s.label}
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}
