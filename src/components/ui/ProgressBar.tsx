import { clamp } from '@/lib/metrics';
import { cn } from '@/lib/cn';

/** Thin square-ended progress bar. */
export function ProgressBar({
  value,
  max = 100,
  tone = 'light',
  accent = false,
  height = 2,
  label,
  className,
}: {
  value: number;
  max?: number;
  tone?: 'light' | 'dark';
  accent?: boolean;
  height?: number;
  label?: string;
  className?: string;
}) {
  const pct = clamp(max > 0 ? (value / max) * 100 : 0);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn('relative w-full', tone === 'dark' ? 'bg-line-d' : 'bg-line', className)}
      style={{ height }}
    >
      <div className={cn('absolute inset-y-0 left-0', accent ? 'bg-red' : tone === 'dark' ? 'bg-white' : 'bg-ink')} style={{ width: `${pct}%` }} />
    </div>
  );
}
