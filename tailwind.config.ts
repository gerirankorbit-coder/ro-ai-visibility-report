import type { Config } from 'tailwindcss';
import containerQueries from '@tailwindcss/container-queries';

const v = (name: string) => `var(--${name})`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    borderRadius: { none: '0', full: '9999px', DEFAULT: '0' },
    boxShadow: { none: 'none' },
    extend: {
      colors: {
        paper: v('paper'),
        white: v('white'),
        ink: v('ink'),
        'ink-2': v('ink-2'),
        muted: v('muted'),
        ghost: v('ghost'),
        line: v('line'),
        black: v('black'),
        'black-2': v('black-2'),
        'line-d': v('line-d'),
        'muted-d': v('muted-d'),
        red: v('red'),
        good: v('good'),
        warn: v('warn'),
        bad: v('bad'),
      },
      fontFamily: {
        display: ['"Inter Tight Variable"', '"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        meta: ['10.5px', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        small: ['12px', { lineHeight: '1.45' }],
        body: ['14px', { lineHeight: '1.55' }],
        h3: ['15px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        h2: ['22px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        statement: ['28px', { lineHeight: '1.22', letterSpacing: '-0.025em' }],
        h1: ['40px', { lineHeight: '1.08', letterSpacing: '-0.035em' }],
      },
      maxWidth: { content: '1376px' },
      containers: {
        sm: '480px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  plugins: [containerQueries],
} satisfies Config;
