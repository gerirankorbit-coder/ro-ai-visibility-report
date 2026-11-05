import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ArrowRight, ArrowUpRight } from './icons';

type Variant = 'primary' | 'outline' | 'quiet' | 'danger';
type Arrow = 'up-right' | 'right' | 'none' | ReactNode;

interface Common {
  variant?: Variant;
  tone?: 'light' | 'dark';
  arrow?: Arrow;
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

function classes(variant: Variant, tone: 'light' | 'dark', size: 'sm' | 'md') {
  const h = size === 'sm' ? 'h-7' : 'h-8';
  const shared = cn('group inline-flex select-none items-stretch gap-[2px] whitespace-nowrap text-[11px] font-medium leading-none disabled:opacity-40', h);
  if (variant === 'primary') {
    return {
      root: shared,
      label: cn('flex items-center px-3', tone === 'dark' ? 'bg-white text-ink' : 'bg-ink text-white'),
      cell: cn('flex aspect-square items-center justify-center', tone === 'dark' ? 'bg-white text-ink' : 'border border-ink bg-white text-ink', 'transition-colors group-hover:bg-accent group-hover:text-white group-hover:border-accent'),
    };
  }
  if (variant === 'danger') {
    return { root: shared, label: 'flex items-center px-3 bg-bad text-white', cell: 'flex aspect-square items-center justify-center border border-bad bg-white text-bad' };
  }
  if (variant === 'outline') {
    return {
      root: shared,
      label: cn('flex items-center px-3 border', tone === 'dark' ? 'border-line-d text-white group-hover:border-white' : 'border-ink/80 text-ink group-hover:bg-white'),
      cell: cn('flex aspect-square items-center justify-center border', tone === 'dark' ? 'border-line-d text-white' : 'border-ink/80 text-ink'),
    };
  }
  return {
    root: shared,
    label: cn('flex items-center px-1 underline-offset-4 group-hover:underline', tone === 'dark' ? 'text-white' : 'text-ink'),
    cell: 'flex items-center',
  };
}

function ArrowGlyph({ arrow }: { arrow: Arrow }) {
  if (arrow === 'none') return null;
  if (arrow === 'right') return <ArrowRight />;
  if (arrow === 'up-right' || arrow === undefined) return <ArrowUpRight />;
  return <>{arrow}</>;
}

export function Button({
  variant = 'primary',
  tone = 'light',
  arrow = 'right',
  size = 'md',
  children,
  className,
  type = 'button',
  ...rest
}: Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  const c = classes(variant, tone, size);
  return (
    <button type={type} className={cn(c.root, className)} {...rest}>
      <span className={c.label}>{children}</span>
      {arrow !== 'none' && (
        <span className={c.cell}>
          <ArrowGlyph arrow={arrow} />
        </span>
      )}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  tone = 'light',
  arrow = 'right',
  size = 'md',
  children,
  className,
  ...rest
}: Common & Omit<LinkProps, 'children'>) {
  const c = classes(variant, tone, size);
  return (
    <Link className={cn(c.root, className)} {...rest}>
      <span className={c.label}>{children}</span>
      {arrow !== 'none' && (
        <span className={c.cell}>
          <ArrowGlyph arrow={arrow} />
        </span>
      )}
    </Link>
  );
}

/** Small square icon-only button (remove row, close modal…). */
export function IconButton({
  label,
  children,
  className,
  tone = 'light',
  ...rest
}: { label: string; children: ReactNode; tone?: 'light' | 'dark' } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center border',
        tone === 'dark' ? 'border-line-d text-white hover:bg-black-2' : 'border-line bg-white text-ink hover:border-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
