import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { FONT, chartTheme, type ChartTheme, type Tone } from '@/lib/tokens';

export type { Tone };
export const snap = (v: number) => Math.round(v) + 0.5;
export const fx = (v: number) => Number(v.toFixed(2));

export interface Tip {
  /** Position in viewBox units. */
  x: number;
  y: number;
  lines: string[];
}

export function useTip() {
  return useState<Tip | null>(null);
}

export interface SrTable {
  caption: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}

/**
 * Wraps a chart SVG: relative container, hover tooltip (black box, mono 11px),
 * and a visually-hidden table alternative for screen readers.
 */
export function ChartFrame({
  width,
  height,
  label,
  table,
  tip,
  children,
  className,
  svgClassName,
  maxWidth,
}: {
  width: number;
  height: number;
  label: string;
  table?: SrTable;
  tip?: Tip | null;
  children: ReactNode;
  className?: string;
  svgClassName?: string;
  maxWidth?: number;
}) {
  return (
    <div className={cn('relative w-full', className)} style={maxWidth ? { maxWidth } : undefined}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label={label}
        className={cn('block h-auto overflow-visible', svgClassName)}
        style={{ fontFamily: FONT.mono }}
      >
        {children}
      </svg>
      {tip ? (
        <div
          className="chart-tip t-mono pointer-events-none absolute z-10 whitespace-nowrap bg-black px-2.5 py-1.5 text-[11px] leading-[1.45] text-white"
          style={{ left: `${(tip.x / width) * 100}%`, top: `${(tip.y / height) * 100}%`, transform: 'translate(-50%, calc(-100% - 10px))' }}
        >
          {tip.lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      ) : null}
      {table ? (
        <div className="sr-only-table">
        <table>
          <caption>{table.caption}</caption>
          <thead>
            <tr>
              {table.headers.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      ) : null}
    </div>
  );
}

export function useTheme(tone: Tone = 'light'): ChartTheme {
  return chartTheme(tone);
}

/** Horizontal gridlines (4 intervals) with mono axis labels on the left. */
export function GridY({
  x0,
  x1,
  y,
  max,
  theme,
  fmt = (v) => String(Math.round(v)),
  labelX,
}: {
  x0: number;
  x1: number;
  y: (v: number) => number;
  max: number;
  theme: ChartTheme;
  fmt?: (v: number) => string;
  labelX?: number;
}) {
  return (
    <g>
      {[0, 1, 2, 3, 4].map((t) => {
        const v = (max * t) / 4;
        const yy = snap(y(v));
        return (
          <g key={t}>
            <line x1={x0} x2={x1} y1={yy} y2={yy} stroke={theme.grid} strokeWidth={1} shapeRendering="crispEdges" />
            <text x={labelX ?? x0 - 10} y={yy + 3.5} textAnchor="end" fontSize={10.5} fill={theme.axis} fontFamily={FONT.mono}>
              {fmt(v)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** 6px square marker; the current one is rotated 45° and red. */
export function Marker({ x, y, current, color, accent, bg, shape = 'square' }: { x: number; y: number; current?: boolean; color: string; accent: string; bg: string; shape?: 'square' | 'circle' | 'triangle' }) {
  const s = 6;
  if (current) {
    return <rect x={fx(x - s / 2)} y={fx(y - s / 2)} width={s} height={s} fill={accent} transform={`rotate(45 ${fx(x)} ${fx(y)})`} />;
  }
  if (shape === 'circle') return <circle cx={fx(x)} cy={fx(y)} r={3.2} fill={bg} stroke={color} strokeWidth={1.5} />;
  if (shape === 'triangle') return <path d={`M${fx(x)} ${fx(y - 3.6)}L${fx(x + 3.6)} ${fx(y + 3)}L${fx(x - 3.6)} ${fx(y + 3)}Z`} fill={bg} stroke={color} strokeWidth={1.5} strokeLinejoin="miter" />;
  return <rect x={fx(x - s / 2)} y={fx(y - s / 2)} width={s} height={s} fill={color} />;
}

/** Legend item key: a short line (with dash) + a marker. */
export function LegendKey({ color, dash, shape = 'square', bar = false }: { color: string; dash?: string; shape?: 'square' | 'circle' | 'triangle'; bar?: boolean }) {
  if (bar) {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <rect width="10" height="10" fill={color} />
      </svg>
    );
  }
  return (
    <svg width="22" height="10" viewBox="0 0 22 10" aria-hidden>
      <line x1="0" x2="22" y1="5" y2="5" stroke={color} strokeWidth="1.5" strokeDasharray={dash} />
      {shape === 'circle' ? <circle cx="11" cy="5" r="2.8" fill="#fff" stroke={color} strokeWidth="1.3" /> : shape === 'triangle' ? <path d="M11 1.8 14 7.6H8z" fill="#fff" stroke={color} strokeWidth="1.3" /> : <rect x="8" y="2" width="6" height="6" fill={color} />}
    </svg>
  );
}

export function Legend({ items, tone = 'light', className }: { items: Array<{ name: string; color: string; dash?: string; shape?: 'square' | 'circle' | 'triangle'; value?: ReactNode; bar?: boolean }>; tone?: Tone; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-6 gap-y-2', className)}>
      {items.map((i) => (
        <li key={i.name} className={cn('t-meta flex items-center gap-2', tone === 'dark' ? 'text-muted-d' : 'text-ink-2')}>
          <LegendKey color={i.color} dash={i.dash} shape={i.shape} bar={i.bar} />
          <span>{i.name}</span>
          {i.value !== undefined ? <span className={cn('t-mono text-[11px]', tone === 'dark' ? 'text-white' : 'text-ink')}>{i.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}
