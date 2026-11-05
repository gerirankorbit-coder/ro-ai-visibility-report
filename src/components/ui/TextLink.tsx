import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ArrowRight, ArrowUpRight } from './icons';

const cls = (tone: 'light' | 'dark') =>
  cn(
    'inline-flex items-center gap-1.5 text-[11px] font-medium leading-none underline decoration-1 underline-offset-4 hover:decoration-2',
    tone === 'dark' ? 'text-white decoration-white/70' : 'text-ink decoration-ink/70',
  );

export function TextLink({
  to,
  children,
  tone = 'light',
  arrow = 'up-right',
  className,
  ...rest
}: { children: ReactNode; tone?: 'light' | 'dark'; arrow?: 'up-right' | 'right' | 'none'; className?: string } & Omit<LinkProps, 'children'>) {
  return (
    <Link to={to} className={cn(cls(tone), className)} {...rest}>
      {children}
      {arrow === 'up-right' ? <ArrowUpRight size={9} /> : arrow === 'right' ? <ArrowRight size={9} /> : null}
    </Link>
  );
}

export function TextAnchor({
  children,
  tone = 'light',
  className,
  ...rest
}: { children: ReactNode; tone?: 'light' | 'dark' } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn(cls(tone), className)} {...rest}>
      {children}
      <ArrowUpRight size={9} />
    </a>
  );
}

/** Non-interactive look-alike used for disabled "View →" cells. */
export function DisabledLink({ children }: { children: ReactNode }) {
  return (
    <span aria-disabled="true" className="inline-flex items-center gap-1.5 text-[11px] text-muted">
      {children}
      <ArrowRight size={9} />
    </span>
  );
}
