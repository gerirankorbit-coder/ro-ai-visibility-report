import { T } from '@/lib/tokens';
import { fx } from './common';

/** 84×28 sparkline: ink line, current point as a red diamond. */
export function Sparkline({ values, width = 84, height = 28, label, tone = 'light', max: maxIn }: { values: number[]; width?: number; height?: number; label?: string; tone?: 'light' | 'dark'; max?: number }) {
  const n = values.length;
  const max = maxIn ?? Math.max(1, ...values);
  const min = 0;
  const pad = 4;
  const x = (i: number) => (n < 2 ? width - pad : pad + ((width - pad * 2) * i) / (n - 1));
  const y = (v: number) => height - pad - ((height - pad * 2) * (v - min)) / (max - min || 1);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${fx(x(i))} ${fx(y(v))}`).join(' ');
  const last = values[n - 1] ?? 0;
  const stroke = tone === 'dark' ? '#FFFFFF' : T.ink;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label ?? `Trend: ${values.join(', ')}`} className="block shrink-0 overflow-visible">
      <line x1={0} x2={width} y1={height - 0.5} y2={height - 0.5} stroke={tone === 'dark' ? T.lineD : T.line} strokeWidth={1} shapeRendering="crispEdges" />
      {n > 1 ? <path className="draw" pathLength={1} d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" shapeRendering="geometricPrecision" /> : null}
      <rect x={fx(x(n - 1) - 3)} y={fx(y(last) - 3)} width={6} height={6} fill={T.red} transform={`rotate(45 ${fx(x(n - 1))} ${fx(y(last))})`} />
    </svg>
  );
}
