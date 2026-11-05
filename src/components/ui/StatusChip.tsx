import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { T } from '@/lib/tokens';
import { STATUS_LABEL } from '@/lib/constants';
import type { SourceStatus } from '@/types/schema';

type ChipTone = 'good' | 'warn' | 'bad' | 'muted' | 'ink' | 'red';
const COLORS: Record<ChipTone, string> = { good: T.good, warn: T.warn, bad: T.bad, muted: T.ghost, ink: T.ink, red: T.accent };

export const STATUS_TONE: Record<SourceStatus, ChipTone> = {
  verified: 'good',
  synced: 'good',
  progress: 'warn',
  queued: 'muted',
};

export function StatusChip({
  tone,
  children,
  dark = false,
  className,
}: {
  tone: ChipTone;
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-[10.5px] leading-none', dark ? 'text-white' : 'text-ink', className)}>
      <span aria-hidden className="inline-block h-[6px] w-[6px]" style={{ background: tone === 'ink' && dark ? '#fff' : COLORS[tone] }} />
      {children}
    </span>
  );
}

export function SourceStatusChip({ status }: { status: SourceStatus }) {
  return <StatusChip tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</StatusChip>;
}
