import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { RedSquare } from './SectionLabel';

export interface Column<R> {
  key: string;
  header: ReactNode;
  render: (row: R, index: number) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  width?: string;
}

/**
 * Index table: meta uppercase header, 44px rows, hairline separators.
 * Scrolls horizontally inside its own container on narrow screens.
 */
export function IndexTable<R>({
  columns,
  rows,
  rowKey,
  highlight,
  caption,
  tone = 'light',
  minWidth = 640,
  dense = false,
  className,
  onRowClick,
  rowLabel,
}: {
  columns: Column<R>[];
  rows: R[];
  rowKey: (r: R, i: number) => string;
  highlight?: (r: R, i: number) => boolean;
  caption?: string;
  tone?: 'light' | 'dark';
  minWidth?: number;
  dense?: boolean;
  className?: string;
  onRowClick?: (r: R) => void;
  rowLabel?: (r: R) => string;
}) {
  const dark = tone === 'dark';
  const hasMarker = Boolean(highlight);
  const align = (a?: 'left' | 'right' | 'center') => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');
  return (
    <div className={cn('index-table relative w-full overflow-x-auto', className)} tabIndex={0} role="region" aria-label={caption ?? 'Table'}>
      <table className="w-full border-collapse text-[12px]" style={{ minWidth }}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className={cn('border-b', dark ? 'border-line-d' : 'border-line')}>
            {hasMarker ? <th aria-hidden className="w-5 p-0" /> : null}
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn('t-meta whitespace-nowrap pb-3 pr-4 font-normal uppercase tracking-[0.06em]', dark ? 'text-muted-d' : 'text-muted', align(c.align), c.className)}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const hi = highlight?.(r, i) ?? false;
            return (
              <tr
                key={rowKey(r, i)}
                aria-current={hi ? 'true' : undefined}
                aria-label={rowLabel?.(r)}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cn(
                  'border-b align-middle transition-colors',
                  dark ? 'border-line-d hover:bg-black-2' : 'border-line hover:bg-white',
                  hi && !dark && 'bg-white',
                  hi && dark && 'bg-black-2',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {hasMarker ? <td className="w-5 p-0 align-middle">{hi ? <RedSquare /> : null}</td> : null}
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(dense ? 'h-9' : 'h-11', 'whitespace-nowrap pr-4', dark ? 'text-white' : 'text-ink', align(c.align), c.className)}
                  >
                    {c.render(r, i)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
