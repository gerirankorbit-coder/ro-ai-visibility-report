import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function RedSquare({ size = 6, className }: { size?: number; className?: string }) {
  return <span aria-hidden className={cn('inline-block shrink-0 bg-accent', className)} style={{ width: size, height: size }} />;
}

export function SectionLabel({
  children,
  tone = 'light',
  as: As = 'h2',
  className,
  id,
}: {
  children: ReactNode;
  tone?: 'light' | 'dark';
  as?: 'h2' | 'h3' | 'div' | 'span';
  className?: string;
  id?: string;
}) {
  return (
    <As id={id} className={cn('flex items-center gap-2 text-[11px] font-medium leading-none', tone === 'dark' ? 'text-white' : 'text-ink', className)}>
      <RedSquare />
      {children}
    </As>
  );
}
