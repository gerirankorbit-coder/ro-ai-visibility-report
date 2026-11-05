import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { RedSquare } from './SectionLabel';
import { DeltaBadge } from './DeltaBadge';

/** KPI block: hairline top, meta label, big number, unit, delta and caption. No box. */
export function KpiBlock({
  label,
  value,
  unit,
  delta,
  deltaUnit = '',
  caption,
  aside,
  tone = 'light',
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: number | null;
  deltaUnit?: string;
  caption?: ReactNode;
  aside?: ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const dark = tone === 'dark';
  return (
    <div className={cn('flex min-w-0 flex-col gap-3 border-t pt-4', dark ? 'border-line-d' : 'border-line', className)}>
      <div className={cn('t-meta flex items-center gap-2', dark ? 'text-white' : 'text-ink')}>
        <RedSquare />
        {label}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className={cn('font-display num font-medium leading-[0.9] tracking-[-0.05em]', dark ? 'text-white' : 'text-ink')} style={{ fontSize: 'clamp(40px, 4.2cqw, 60px)' }}>
          {value}
          {unit ? <span className={cn('ml-0.5 text-[0.4em] tracking-[-0.02em]', dark ? 'text-muted-d' : 'text-muted')}>{unit}</span> : null}
        </div>
        {aside ? <div className="pb-1">{aside}</div> : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {delta !== undefined ? <DeltaBadge value={delta} unit={deltaUnit} tone={tone} /> : null}
        {caption ? <span className={cn('text-small', dark ? 'text-muted-d' : 'text-muted')}>{caption}</span> : null}
      </div>
    </div>
  );
}

/** Row of KPI blocks separated by vertical hairlines. */
export function KpiRow({ children, cols = 6, tone = 'light', className }: { children: ReactNode; cols?: 3 | 4 | 5 | 6; tone?: 'light' | 'dark'; className?: string }) {
  const grid = {
    3: '@lg:grid-cols-3',
    4: '@lg:grid-cols-4',
    5: '@lg:grid-cols-5',
    6: '@lg:grid-cols-3 @xl:grid-cols-6',
  }[cols];
  return (
    <div className={cn('overflow-hidden', className)}>
      <div className={cn('kpi-row -ml-px grid grid-cols-2 gap-y-10', grid, tone === 'dark' ? 'kpi-row--dark' : '')}>{children}</div>
    </div>
  );
}
