/** A cell counts as a number only if it is digits (with optional thousands commas / decimals). */
const toNum = (c: string) => (/^-?\d[\d,]*(\.\d+)?$/.test(c.trim()) ? Number(c.trim().replace(/,/g, '')) : NaN);

/**
 * Parse pasted rows "date, n1, n2, …" from BrightLocal / GBP exports or a spreadsheet.
 * Tab, semicolon, comma or space separated; the last `cols` cells are the values and everything
 * before them is the date label. Header, total and blank lines are skipped.
 */
export function parseRows(text: string, cols: number): Array<{ date: string; values: number[] }> {
  const out: Array<{ date: string; values: number[] }> = [];
  const take = (cells: string[]) => {
    if (cells.length < cols + 1) return null;
    const vals = cells.slice(-cols).map(toNum);
    if (vals.some((n) => !Number.isFinite(n))) return null;
    const date = cells.slice(0, -cols).join(' ').trim();
    return date ? { date: date.slice(0, 40), values: vals.map((n) => Math.max(0, Math.round(n))) } : null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const sep = line.includes('\t') ? '\t' : line.includes(';') ? ';' : line.includes(',') && !/\d,\d{3}\b/.test(line) ? ',' : null;
    const row = (sep ? take(line.split(sep).map((c) => c.trim()).filter(Boolean)) : null) ?? take(line.split(/\s+/));
    if (row) out.push(row);
  }
  return out;
}
