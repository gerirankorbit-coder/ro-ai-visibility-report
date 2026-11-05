/** `YYYY-MM-01` or `YYYY-MM` -> `YYYY-MM`. */
export const monthKey = (period: string) => period.slice(0, 7);
export const periodOf = (key: string) => `${key.slice(0, 7)}-01`;

const parts = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return { y: y ?? 1970, m: m ?? 1 };
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "October 2026" (long) or "Oct" (short) or "Oct 2026" (shortYear). */
export function monthLabel(key: string, style: 'long' | 'short' | 'shortYear' = 'long'): string {
  const { y, m } = parts(key);
  const name = MONTHS[(m - 1 + 12) % 12] ?? '';
  if (style === 'short') return name.slice(0, 3);
  if (style === 'shortYear') return `${name.slice(0, 3)} ${y}`;
  return `${name} ${y}`;
}

export function nextMonthKey(key: string): string {
  let { y, m } = parts(key);
  m += 1;
  if (m > 12) {
    m = 1;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function slugify(t: string): string {
  return String(t)
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Short slug for a client name, dropping trailing "& Drain"-style suffixes after the ampersand. */
export function clientSlug(name: string): string {
  const base = name.split('&')[0] ?? name;
  return slugify(base) || slugify(name) || 'client';
}

export function initials(n: string): string {
  return (
    String(n || '?')
      .replace(/&/g, ' ')
      .split(/\s+/)
      .filter((w) => /[A-Za-z0-9]/.test(w))
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '?'
  );
}

export const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');

export function fmtDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (!withTime) return date;
  return `${date}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

export function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** "June 2026" from a `YYYY-MM-DD` date. */
export function sinceLabel(date: string | null): string {
  return date ? monthLabel(monthKey(date)) : '';
}

/** Index (0 = Mon) of today in the client's week. */
export const todayIndex = (d = new Date()) => (d.getDay() + 6) % 7;
