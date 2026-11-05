import { cn } from '@/lib/cn';

/** Signature two-tone statement: first sentence ink, continuation ghost grey. */
export function Statement({
  lead,
  rest,
  tone = 'light',
  className,
  as: As = 'p',
}: {
  lead: string;
  rest?: string;
  tone?: 'light' | 'dark';
  className?: string;
  as?: 'p' | 'div' | 'blockquote';
}) {
  return (
    <As className={cn('t-statement max-w-[30ch] @md:max-w-[40ch]', className)} style={{ textWrap: 'pretty' } as React.CSSProperties}>
      <span className={tone === 'dark' ? 'text-white' : 'text-ink'}>{lead}</span>
      {rest ? <span className={tone === 'dark' ? 'text-[#5A5A5A]' : 'text-ghost'}> {rest}</span> : null}
    </As>
  );
}
