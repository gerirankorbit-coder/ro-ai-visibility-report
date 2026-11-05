/**
 * Resolved hex values of the design tokens. Charts and the screenshot exporter use
 * these directly (never `var(--x)` inside SVG attributes) so exports are exact.
 * Keep in sync with :root in src/styles/index.css.
 */
export const T = {
  paper: '#FFFFFF',
  white: '#FFFFFF',
  panel: '#F7F7F8',
  ink: '#0A0A0A',
  ink2: '#3F3F46',
  muted: '#71717A',
  ghost: '#A1A1AA',
  line: '#E4E4E7',
  black: '#000000',
  black2: '#18181B',
  lineD: '#27272A',
  mutedD: '#A1A1AA',
  /** Brand purple (gradient end). */
  accent: '#B227FF',
  /** Brand cyan (gradient start); too light for text or thin lines on white. */
  cyan: '#30FEFE',
  /** Readable cyan for lines and markers on white. */
  cyanInk: '#0E9FC6',
  good: '#15803D',
  warn: '#CE6C01',
  bad: '#C70509',
  /** Comparison / previous series. */
  compare: '#A1A1AA',
  series3: '#0E9FC6',
  series4: '#0A0A0A',
  ghostDark: '#52525B',
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
        accent: T.accent,
        grid: T.lineD,
        track: T.lineD,
        axis: T.mutedD,
        text: '#FFFFFF',
        bg: T.black,
      }
    : {
        main: T.accent,
        compare: T.compare,
        s3: T.series3,
        s4: T.series4,
        accent: T.accent,
        grid: T.line,
        track: T.line,
        axis: T.muted,
        text: T.ink,
        bg: T.paper,
      };
}
export type ChartTheme = ReturnType<typeof chartTheme>;

export const FONT = {
  display: "'Montserrat Variable', Montserrat, system-ui, sans-serif",
  sans: "'Montserrat Variable', Montserrat, system-ui, sans-serif",
  mono: "'Montserrat Variable', Montserrat, system-ui, sans-serif",
} as const;
