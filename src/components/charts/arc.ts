import { fx } from './common';

/** Point on a circle; angle in degrees, 0 = 12 o'clock, clockwise. */
export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** SVG path for a clockwise arc from `from` to `to` degrees (handles full circles). */
export function arcPath(cx: number, cy: number, r: number, from: number, to: number): string {
  const sweep = Math.max(0, Math.min(359.999, to - from));
  if (sweep <= 0) return '';
  if (sweep >= 359.99) {
    const [x0, y0] = polar(cx, cy, r, from);
    const [x1, y1] = polar(cx, cy, r, from + 180);
    return `M${fx(x0)} ${fx(y0)} A${r} ${r} 0 1 1 ${fx(x1)} ${fx(y1)} A${r} ${r} 0 1 1 ${fx(x0)} ${fx(y0)}`;
  }
  const [x0, y0] = polar(cx, cy, r, from);
  const [x1, y1] = polar(cx, cy, r, from + sweep);
  return `M${fx(x0)} ${fx(y0)} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${fx(x1)} ${fx(y1)}`;
}
