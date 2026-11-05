/**
 * Resolved hex values of the design tokens. Charts and the screenshot exporter use
 * these directly (never `var(--x)` inside SVG attributes) so exports are exact.
 * Keep in sync with :root in src/styles/index.css.
 */
export const T = {
  paper: '#F4F4F2',
  white: '#FFFFFF',
  ink: '#0A0A0A',
  ink2: '#3B3B3B',
  muted: '#8C8C8C',
  ghost: '#BDBDBD',
  line: '#E3E3E0',
  black: '#000000',
  black2: '#0E0E0E',
  lineD: '#222222',
  mutedD: '#8A8A8A',
  red: '#E1251B',
  ember1: '#2A0700',
  ember2: '#8A1E04',
  ember3: '#E2550F',
  good: '#1F8A4C',
  warn: '#B7791F',
  bad: '#C0262D',
  /** Comparison / previous series. */
  compare: '#9A9A9A',
  series3: '#6E6E6E',
  series4: '#B5B5B5',
  ghostDark: '#5A5A5A',
} as const;

export type Tone = 'light' | 'dark';

/** Chart palette for a given band tone. */
export function chartTheme(tone: Tone = 'light') {
  return tone === 'dark'
    ? {
        main: '#FFFFFF',
        compare: '#6A6A6A',
        s3: '#9A9A9A',
        s4: '#4A4A4A',
        accent: T.red,
        grid: T.lineD,
        track: T.lineD,
        axis: T.mutedD,
        text: '#FFFFFF',
        bg: T.black,
      }
    : {
        main: T.ink,
        compare: T.compare,
        s3: T.series3,
        s4: T.series4,
        accent: T.red,
        grid: T.line,
        track: T.line,
        axis: T.muted,
        text: T.ink,
        bg: T.paper,
      };
}
export type ChartTheme = ReturnType<typeof chartTheme>;

export const FONT = {
  display: "'Inter Tight Variable', 'Inter Tight', Inter, system-ui, sans-serif",
  sans: "'Inter Variable', Inter, system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, Menlo, monospace",
} as const;
