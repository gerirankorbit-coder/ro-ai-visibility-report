import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<V extends string> {
  value: V;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
}

function useRovingKeys<V extends string>(items: TabItem<V>[], value: V, onChange: (v: V) => void) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = items.findIndex((t) => t.value === value);
    let n = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % items.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = items.length - 1;
    if (n < 0) return;
    e.preventDefault();
    onChange(items[n]!.value);
    refs.current[n]?.focus();
  };
  return { refs, onKeyDown };
}

/** Block tabs: equal columns; the active tab is a filled block. */
export function BlockTabs<V extends string>({
  items,
  value,
  onChange,
  tone = 'light',
  label,
  className,
  idBase,
}: {
  items: TabItem<V>[];
  value: V;
  onChange: (v: V) => void;
  tone?: 'light' | 'dark';
  label: string;
  className?: string;
  idBase?: string;
}) {
  const auto = useId();
  const base = idBase ?? auto;
  const { refs, onKeyDown } = useRovingKeys(items, value, onChange);
  const dark = tone === 'dark';
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('grid grid-cols-1 border-y @md:grid-cols-[repeat(var(--n),minmax(0,1fr))]', dark ? 'border-line-d' : 'border-line', className)}
      style={{ ['--n' as string]: items.length }}
    >
      {items.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`${base}-tab-${t.value}`}
            aria-selected={active}
            aria-controls={`${base}-panel`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={onKeyDown}
            className={cn(
              'flex min-w-0 flex-col items-start gap-1.5 px-4 py-4 text-left transition-colors',
              i > 0 && (dark ? '@md:border-l @md:border-line-d' : '@md:border-l @md:border-line'),
              i > 0 && (dark ? 'border-t border-line-d @md:border-t-0' : 'border-t border-line @md:border-t-0'),
              active ? (dark ? 'bg-black-2' : 'bg-ink') : dark ? 'hover:bg-black-2/60' : 'hover:bg-white',
            )}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className={cn('text-[13px] font-medium leading-tight', active ? 'text-white' : dark ? 'text-muted-d' : 'text-ink-2')}>{t.title}</span>
              {t.aside}
            </span>
            {t.description ? <span className={cn('t-meta', active ? 'text-muted-d' : dark ? 'text-[#5A5A5A]' : 'text-muted')}>{t.description}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/** Small centered tab row with a 1px underline under the active item. */
export function UnderlineTabs<V extends string>({
  items,
  value,
  onChange,
  label,
  className,
  tone = 'light',
}: {
  items: Array<{ value: V; title: ReactNode }>;
  value: V;
  onChange: (v: V) => void;
  label: string;
  className?: string;
  tone?: 'light' | 'dark';
}) {
  const full = items.map((x) => ({ ...x }));
  const { refs, onKeyDown } = useRovingKeys(full, value, onChange);
  return (
    <div role="tablist" aria-label={label} className={cn('flex flex-wrap items-center justify-center gap-6', className)}>
      {items.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={onKeyDown}
            className={cn(
              'border-b pb-1 text-[11px] font-medium leading-none',
              active
                ? tone === 'dark'
                  ? 'border-white text-white'
                  : 'border-ink text-ink'
                : cn('border-transparent', tone === 'dark' ? 'text-muted-d hover:text-white' : 'text-muted hover:text-ink'),
            )}
          >
            {t.title}
          </button>
        );
      })}
    </div>
  );
}
