import { cn } from '@/lib/cn';

/** Grayscale wordmark strip (text only, never real logos). */
export function LogoStrip({ label, names, className, tone = 'light' }: { label?: string; names: readonly string[]; className?: string; tone?: 'light' | 'dark' }) {
  return (
    <div className={cn('flex flex-col gap-5 @lg:flex-row @lg:items-center @lg:gap-10', className)}>
      {label ? <div className={cn('t-meta shrink-0', tone === 'dark' ? 'text-muted-d' : 'text-muted')}>{label}</div> : null}
      <ul className="flex flex-wrap items-center gap-x-8 gap-y-3" aria-label={label}>
        {names.map((n) => (
          <li key={n} className={cn('font-display whitespace-nowrap text-[15px] font-medium tracking-[-0.02em]', tone === 'dark' ? 'text-white/70' : 'text-ink-2/70')}>
            {n}
          </li>
        ))}
      </ul>
    </div>
  );
}
