import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Image/visual card: 0 radius, optional hairline border, caption below. */
export function VisualCard({ children, title, meta, bordered = true, className }: { children: ReactNode; title?: ReactNode; meta?: ReactNode; bordered?: boolean; className?: string }) {
  return (
    <figure className={cn('m-0 flex flex-col gap-3', className)}>
      <div className={cn('bg-white', bordered && 'border border-line')}>{children}</div>
      {title || meta ? (
        <figcaption className="flex flex-col gap-0.5">
          {title ? <span className="text-[13px] text-ink">{title}</span> : null}
          {meta ? <span className="t-meta text-muted">{meta}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
