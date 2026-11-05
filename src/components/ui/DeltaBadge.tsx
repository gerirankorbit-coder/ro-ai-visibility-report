import { cn } from '@/lib/cn';
import { Triangle } from './icons';

/** `▲ 4 pts` / `▼ 2 pts` / `No change` / `New`. Text + glyph only, no fill. */
export function DeltaBadge({
  value,
  unit = '',
  tone = 'light',
  compact = false,
  className,
}: {
  value: number | null;
  unit?: string;
  tone?: 'light' | 'dark';
  compact?: boolean;
  className?: string;
}) {
  const muted = tone === 'dark' ? 'text-muted-d' : 'text-muted';
  const base = cn('t-mono inline-flex items-center gap-1 whitespace-nowrap leading-none', compact ? 'text-[10.5px]' : 'text-[11px]', className);
  if (value === null) return <span className={cn(base, muted)}>New</span>;
  if (value === 0) return <span className={cn(base, muted)}>{compact ? '±0' : 'No change'}</span>;
  const up = value > 0;
  const good = tone === 'dark' ? 'text-[#3FBF73]' : 'text-good';
  const bad = tone === 'dark' ? 'text-[#F2565E]' : 'text-bad';
  return (
    <span className={cn(base, up ? good : bad)}>
      <Triangle dir={up ? 'up' : 'down'} size={compact ? 6 : 7} />
      <span className="sr-only">{up ? 'up' : 'down'}</span>
      {Math.abs(value).toLocaleString('en-US')}
      {unit}
    </span>
  );
}
