import { DAY_NAMES } from '@/types/schema';
import { FONT, T } from '@/lib/tokens';
import { ChartFrame, useTheme, useTip, type Tone } from './common';

/** 7×4 square-cell heatmap; ink opacity 0.08 → 1 scaled min-to-max. */
export function Heatmap({ grid, label, tone = 'light', unit = 'actions' }: { grid: number[][]; label: string; tone?: Tone; unit?: string }) {
  const th = useTheme(tone);
  const [tip, setTip] = useTip();
  const cell = 36;
  const gap = 4;
  const pl = 58;
  const pt = 22;
  const W = pl + 7 * (cell + gap) - gap;
  const H = pt + grid.length * (cell + gap) - gap;
  const flat = grid.flat();
  const max = Math.max(0, ...flat);
  const min = Math.min(...flat);
  const op = (v: number) => (max === min ? (v > 0 ? 1 : 0.08) : 0.08 + 0.92 * ((v - min) / (max - min)));
  return (
    <div className="flex flex-col gap-3">
      <ChartFrame
        width={W}
        height={H}
        label={label}
        tip={tip}
        maxWidth={W + 40}
        table={{ caption: label, headers: ['Week', ...DAY_NAMES], rows: grid.map((r, i) => [`Week ${i + 1}`, ...r]) }}
      >
        {DAY_NAMES.map((d, i) => (
          <text key={d} x={pl + i * (cell + gap) + cell / 2} y={12} textAnchor="middle" fontSize={10.5} fill={th.axis} fontFamily={FONT.mono}>
            {d}
          </text>
        ))}
        {grid.map((row, w) => (
          <g key={w}>
            <text x={pl - 12} y={pt + w * (cell + gap) + cell / 2 + 3.5} textAnchor="end" fontSize={10.5} fill={th.axis} fontFamily={FONT.mono}>
              {`Week ${w + 1}`}
            </text>
            {row.map((v, i) => (
              <rect
                key={i}
                x={pl + i * (cell + gap)}
                y={pt + w * (cell + gap)}
                width={cell}
                height={cell}
                fill={th.main}
                fillOpacity={Number(op(v).toFixed(3))}
                shapeRendering="crispEdges"
                onMouseEnter={() => setTip({ x: pl + i * (cell + gap) + cell / 2, y: pt + w * (cell + gap), lines: [`Week ${w + 1}, ${DAY_NAMES[i]}`, `${v} ${unit}`] })}
                onMouseLeave={() => setTip(null)}
              />
            ))}
          </g>
        ))}
      </ChartFrame>
      <div className={`t-meta flex items-center gap-1.5 ${tone === 'dark' ? 'text-muted-d' : 'text-muted'}`} aria-hidden>
        <span className="mr-1">Less</span>
        {[0.08, 0.35, 0.65, 1].map((o) => (
          <span key={o} className="inline-block h-[10px] w-[10px]" style={{ background: tone === 'dark' ? '#fff' : T.ink, opacity: o }} />
        ))}
        <span className="ml-1">More</span>
      </div>
    </div>
  );
}
