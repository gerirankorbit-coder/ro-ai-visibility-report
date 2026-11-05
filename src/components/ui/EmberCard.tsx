import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { T } from '@/lib/tokens';

/**
 * The ember glow card: radial ember gradient, white center circle, hairline
 * diagonals running from its corners out to the side words.
 */
export function EmberHero({
  left,
  right,
  center,
  centerLabel,
  className,
}: {
  left: string;
  right: string;
  center: ReactNode;
  centerLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative grid grid-cols-1 items-center gap-8 @md:grid-cols-[1fr_auto_1fr] @md:gap-0', className)}>
      {/* Diagonal hairlines (desktop) */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 hidden h-full w-full @md:block" preserveAspectRatio="none" viewBox="0 0 100 100">
        <g stroke={T.lineD} strokeWidth="1" vectorEffect="non-scaling-stroke" shapeRendering="geometricPrecision">
          <line x1="12" y1="50" x2="50" y2="0" vectorEffect="non-scaling-stroke" />
          <line x1="12" y1="50" x2="50" y2="100" vectorEffect="non-scaling-stroke" />
          <line x1="88" y1="50" x2="50" y2="0" vectorEffect="non-scaling-stroke" />
          <line x1="88" y1="50" x2="50" y2="100" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="50" x2="100" y2="50" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      <div className="relative z-[1] flex justify-center @md:justify-start">
        <span className="font-display bg-black pr-4 text-[40px] font-medium leading-none tracking-[-0.04em] text-white">{left}</span>
      </div>
      <div className="relative z-[1] mx-auto w-full max-w-[360px] @md:w-[360px]">
        <div
          className="relative flex aspect-[360/200] w-full items-center justify-center"
          style={{
            background: `radial-gradient(120% 90% at 50% 0%, ${T.ember3}, ${T.ember2} 45%, ${T.ember1} 100%)`,
          }}
        >
          <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 360 200" preserveAspectRatio="none">
            <g stroke="rgba(255,255,255,0.18)" strokeWidth="1" shapeRendering="geometricPrecision">
              <line x1="0" y1="0" x2="144" y2="100" />
              <line x1="360" y1="0" x2="216" y2="100" />
              <line x1="0" y1="200" x2="144" y2="100" />
              <line x1="360" y1="200" x2="216" y2="100" />
            </g>
          </svg>
          <div
            className="font-display num relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white text-[30px] font-medium leading-none tracking-[-0.05em] text-ink"
            role={centerLabel ? 'img' : undefined}
            aria-label={centerLabel}
          >
            {center}
          </div>
        </div>
      </div>
      <div className="relative z-[1] flex justify-center @md:justify-end">
        <span className="font-display bg-black pl-4 text-[40px] font-medium leading-none tracking-[-0.04em] text-white">{right}</span>
      </div>
    </div>
  );
}
