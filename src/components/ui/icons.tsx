import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size: number, rest: SVGProps<SVGSVGElement>) => ({
  width: size,
  height: size,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'square' as const,
  'aria-hidden': true,
  focusable: false,
  ...rest,
});

export const ArrowUpRight = ({ size = 10, ...r }: P) => (
  <svg viewBox="0 0 10 10" {...base(size, r)}>
    <path d="M2.5 7.5 7.5 2.5M3.5 2.5h4v4" />
  </svg>
);
export const ArrowRight = ({ size = 10, ...r }: P) => (
  <svg viewBox="0 0 10 10" {...base(size, r)}>
    <path d="M1.5 5h7M5.5 2l3 3-3 3" />
  </svg>
);
export const ArrowLeft = ({ size = 10, ...r }: P) => (
  <svg viewBox="0 0 10 10" {...base(size, r)}>
    <path d="M8.5 5h-7M4.5 2l-3 3 3 3" />
  </svg>
);
export const Caret = ({ size = 8, ...r }: P) => (
  <svg viewBox="0 0 8 8" {...base(size, r)}>
    <path d="M1.5 3 4 5.5 6.5 3" />
  </svg>
);
export const Check = ({ size = 10, ...r }: P) => (
  <svg viewBox="0 0 10 10" {...base(size, r)}>
    <path d="M1.5 5.2 4 7.5 8.5 2.5" />
  </svg>
);
export const Close = ({ size = 10, ...r }: P) => (
  <svg viewBox="0 0 10 10" {...base(size, r)}>
    <path d="M2 2l6 6M8 2 2 8" />
  </svg>
);
export const Plus = ({ size = 10, ...r }: P) => (
  <svg viewBox="0 0 10 10" {...base(size, r)}>
    <path d="M5 1.5v7M1.5 5h7" />
  </svg>
);
export const Camera = ({ size = 12, ...r }: P) => (
  <svg viewBox="0 0 12 12" {...base(size, r)}>
    <path d="M1.5 3.5h2l1-1.5h3l1 1.5h2v6.5h-9z" />
    <circle cx="6" cy="6.6" r="1.9" />
  </svg>
);
export const Triangle = ({ dir, size = 7 }: { dir: 'up' | 'down'; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 8 8" aria-hidden focusable={false}>
    <path d={dir === 'up' ? 'M4 1 7.5 7h-7z' : 'M4 7 .5 1h7z'} fill="currentColor" />
  </svg>
);
export const Play = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden focusable={false}>
    <path d="M3.5 1.8v10.4L12 7z" fill="currentColor" />
  </svg>
);

/** Rank Orbit mark: a small red geometric mark. */
export const AgencyMark = ({ size = 18, color = '#B227FF' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden focusable={false}>
    <rect x="0" y="0" width="8" height="8" fill={color} />
    <rect x="10" y="0" width="8" height="8" fill="none" stroke={color} strokeWidth="1.5" />
    <rect x="0" y="10" width="8" height="8" fill="none" stroke={color} strokeWidth="1.5" />
    <path d="M10 10h8v8" fill="none" stroke={color} strokeWidth="1.5" />
  </svg>
);
