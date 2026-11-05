import type { ReactNode } from 'react';
import { clamp } from '@/lib/metrics';
import { cn } from '@/lib/cn';
import { DeltaBadge } from '@/components/ui/DeltaBadge';

export interface HBarItem {
  label: string;
  value: number;
  delta?: number | null;
  /** Rendered value text (defaults to `${value}${suffix}`). */
  display?: ReactNode;
  emphasis?: boolean;
}

/** Horizontal bar list: label, mono value + delta, square-ended bar. */
export function HBarList({
  items,
  max = 100,
  suffix = '%',
  tone = 'light',
  deltaUnit = '',
  label,
  barHeight = 6,
  className,
}: {
  items: HBarItem[];
  max?: number;
  suffix?: string;
  tone?: 'light' | 'dark';
  deltaUnit?: string;
  label: string;
  barHeight?: number;
  className?: string;
}) {
  const dark = tone === 'dark';
  return (
    <ul aria-label={label} className={cn('flex flex-col gap-4', className)}>
      {items.map((it) => {
        const pct = clamp(max > 0 ? (it.value / max) * 100 : 0);
        return (
          <li key={it.label} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className={cn('text-[12px]', it.emphasis ? 'font-medium' : '', dark ? 'text-white' : 'text-ink')}>{it.label}</span>
              <span className="flex items-baseline gap-2.5">
                {it.delta !== undefined ? <DeltaBadge value={it.delta} unit={deltaUnit} tone={tone} compact /> : null}
                <span className={cn('t-mono text-[12.5px]', dark ? 'text-white' : 'text-ink')}>{it.display ?? `${it.value}${suffix}`}</span>
              </span>
            </div>
            <div className={cn('relative w-full', dark ? 'bg-line-d' : 'bg-line')} style={{ height: barHeight }} aria-hidden>
              <div className={cn('absolute inset-y-0 left-0', it.emphasis ? 'bg-red' : dark ? 'bg-white' : 'bg-ink')} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
