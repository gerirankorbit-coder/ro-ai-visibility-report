import { useState, type ReactNode } from 'react';
import { Button, Checkbox, Close, IconButton, NumberInput, SelectInput, TextArea, TextInput, Toggle, inputCls } from '@/components/ui';
import { cn } from '@/lib/cn';
import { DAY_NAMES } from '@/types/schema';
import { SECTION_KEYS, SECTION_TITLES, type Gmb, type ReportSectionKey, type TileStatus } from '@/types/gmb';
import { FormGroup } from './BusinessInfoForm';
import { ImageDrop } from './ImageDrop';

/* ------------------------------------------------------------------ */
/* Paste parsing (BrightLocal / GBP exports, spreadsheets)             */
/* ------------------------------------------------------------------ */

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

function PasteBox({ label, cols, colNames, rows, onApply }: { label: string; cols: number; colNames: string[]; rows: number; onApply: (r: Array<{ date: string; values: number[] }>) => void }) {
  const [text, setText] = useState('');
  const parsed = text.trim() ? parseRows(text, cols) : [];
  return (
    <div className="flex flex-col gap-2">
      <TextArea
        label={`${label}: paste rows (Date, ${colNames.join(', ')})`}
        rows={4}
        value={text}
        placeholder={`Oct 1\t3\t5\t2\t1\nOct 2\t4\t6\t1\t0`}
        onChange={(e) => setText(e.target.value)}
        className="[&_textarea]:font-mono [&_textarea]:text-[12px]"
      />
      <div className="flex items-center gap-3 text-[12px]">
        <Button size="sm" variant="outline" arrow="none" disabled={!parsed.length} onClick={() => (onApply(parsed), setText(''))}>
          {parsed.length ? `Use ${parsed.length} rows` : 'Paste rows above'}
        </Button>
        <span className="text-muted">Saved now: {rows} rows</span>
        {rows ? (
          <button type="button" className="text-bad underline" onClick={() => onApply([])}>
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Seg<V extends string>({ value, onChange, options, label }: { value: V; onChange: (v: V) => void; options: Array<[V, string]>; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex border border-ink">
      {options.map(([v, t]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)} className={cn('h-8 px-3 text-[12px] font-semibold', value === v ? 'bg-ink text-white' : 'bg-white text-ink')}>
          {t}
        </button>
      ))}
    </div>
  );
}

const StatusSelect = ({ label, value, onChange }: { label: string; value: TileStatus; onChange: (v: TileStatus) => void }) => (
  <SelectInput label={label} value={value} onChange={(e) => onChange(e.target.value as TileStatus)}>
    <option value="ok">OK</option>
    <option value="attention">In progress</option>
  </SelectInput>
);

const lines = (s: string) => s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

function Section({ id, gmb, children, title, aside }: { id: ReportSectionKey; gmb: Gmb; children: ReactNode; title?: string; aside?: string }) {
  const on = gmb.sections[id];
  return (
    <FormGroup title={title ?? SECTION_TITLES[id]} aside={on ? aside : 'Turned off for this month (see Report sections above).'}>
      <div className={cn(!on && 'pointer-events-none opacity-40')} aria-disabled={!on}>
        {children}
      </div>
    </FormGroup>
  );
}

/* ------------------------------------------------------------------ */
/* Editor                                                              */
/* ------------------------------------------------------------------ */

export function GmbEditor({ clientId, gmb, onChange }: { clientId: string; gmb: Gmb; onChange: (fn: (g: Gmb) => Gmb) => void }) {
  const set = <K extends keyof Gmb>(k: K, v: Gmb[K] | ((old: Gmb[K]) => Gmb[K])) => onChange((g) => ({ ...g, [k]: typeof v === 'function' ? (v as (o: Gmb[K]) => Gmb[K])(g[k]) : v }));
  const [bulk, setBulk] = useState('');
  const ins = gmb.insights;
  const rv = gmb.reviews;
  const rk = gmb.rankings;

  return (
    <div>
      <FormGroup title="Report sections" aside="Choose what goes into this client's report this month. Next month starts with the same choice.">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
          {SECTION_KEYS.map((k) => (
            <Checkbox key={k} label={SECTION_TITLES[k]} checked={gmb.sections[k]} onChange={(v) => set('sections', (s) => ({ ...s, [k]: v }))} />
          ))}
        </div>
        <TextInput className="mt-5 max-w-[420px]" label="Cover title" value={gmb.coverTitle} onChange={(e) => set('coverTitle', e.target.value)} />
      </FormGroup>

      <Section id="summary" gmb={gmb} aside="The four status tiles at the top of the Summary page.">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          <StatusSelect label="Links & Authority" value={gmb.summary.links} onChange={(v) => set('summary', (s) => ({ ...s, links: v }))} />
          <StatusSelect label="Rank Tracker" value={gmb.summary.rank} onChange={(v) => set('summary', (s) => ({ ...s, rank: v }))} />
          <StatusSelect label="GBP Audit" value={gmb.summary.gbp} onChange={(v) => set('summary', (s) => ({ ...s, gbp: v }))} />
          <StatusSelect label="On-Site SEO" value={gmb.summary.onsite} onChange={(v) => set('summary', (s) => ({ ...s, onsite: v }))} />
        </div>
      </Section>

      <Section id="insights" gmb={gmb} aside="Paste daily numbers from BrightLocal and the tool draws the charts, or upload screenshots instead.">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end gap-5">
            <Seg label="Insights source" value={ins.mode} onChange={(v) => set('insights', (o) => ({ ...o, mode: v }))} options={[['data', 'Draw charts from data'], ['image', 'Use screenshots']]} />
            <TextInput className="w-[220px]" label="Date range label" placeholder="Last 30 Days" value={ins.range} onChange={(e) => set('insights', (o) => ({ ...o, range: e.target.value }))} />
          </div>
          {ins.mode === 'image' ? (
            <ImageDrop folder={clientId} label="Insights screenshots (Views, Actions, Phone calls)" max={3} columns={3} value={ins.images} onChange={(v) => set('insights', (o) => ({ ...o, images: v }))} />
          ) : (
            <>
              <PasteBox
                label="Views"
                cols={4}
                colNames={['Search Desktop', 'Search Mobile', 'Maps Desktop', 'Maps Mobile']}
                rows={ins.views.length}
                onApply={(r) => set('insights', (o) => ({ ...o, views: r.map(({ date, values: [sd, sm, md, mm] }) => ({ date, sd: sd!, sm: sm!, md: md!, mm: mm! })) }))}
              />
              <PasteBox
                label="Actions"
                cols={3}
                colNames={['Website clicks', 'Request direction', 'Call you']}
                rows={ins.actions.length}
                onApply={(r) => set('insights', (o) => ({ ...o, actions: r.map(({ date, values: [web, dir, call] }) => ({ date, web: web!, dir: dir!, call: call! })) }))}
              />
              <div>
                <div className="t-meta mb-2 uppercase tracking-[0.06em] text-muted">Phone calls by weekday</div>
                <div className="grid grid-cols-7 gap-2">
                  {DAY_NAMES.map((d, i) => (
                    <NumberInput key={d} label={d} value={ins.calls[i] ?? 0} onChange={(v) => set('insights', (o) => ({ ...o, calls: o.calls.map((c, j) => (j === i ? v : c)) }))} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Section>

      <Section id="reviews" gmb={gmb} aside="Up to the last 5 reviews.">
        <div className="flex flex-col gap-5">
          <Seg label="Reviews source" value={rv.mode} onChange={(v) => set('reviews', (o) => ({ ...o, mode: v }))} options={[['data', 'Type reviews'], ['image', 'Use a screenshot']]} />
          {rv.mode === 'image' ? (
            <ImageDrop folder={clientId} label="Reviews screenshot" max={1} columns={2} value={rv.image ? [rv.image] : []} onChange={(v) => set('reviews', (o) => ({ ...o, image: v[0] ?? null }))} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                <NumberInput label="Total reviews" value={rv.total} onChange={(v) => set('reviews', (o) => ({ ...o, total: v }))} />
                <TextInput label="Average rating" type="number" step="0.1" min={0} max={5} value={rv.rating} onChange={(e) => set('reviews', (o) => ({ ...o, rating: Math.max(0, Math.min(5, Number(e.target.value) || 0)) }))} />
              </div>
              {rv.items.map((it, i) => {
                const patch = (p: Partial<typeof it>) => set('reviews', (o) => ({ ...o, items: o.items.map((x, j) => (j === i ? { ...x, ...p } : x)) }));
                return (
                  <div key={i} className="grid grid-cols-1 gap-3 border border-line bg-white p-3 md:grid-cols-[1fr_160px]">
                    <TextArea label={`Review ${i + 1} text (optional)`} rows={2} value={it.text} onChange={(e) => patch({ text: e.target.value })} />
                    <div className="flex flex-col gap-3">
                      <SelectInput label="Stars" value={it.stars} onChange={(e) => patch({ stars: Number(e.target.value) })}>
                        {[5, 4, 3, 2, 1].map((s) => (
                          <option key={s} value={s}>
                            {'★'.repeat(s)} ({s})
                          </option>
                        ))}
                      </SelectInput>
                      <TextInput label="Detected on" placeholder="23rd Jun 2026" value={it.date} onChange={(e) => patch({ date: e.target.value })} />
                    </div>
                    <div className="flex items-end gap-2 md:col-span-2">
                      <TextInput className="flex-1" label="Review link (View Review button)" value={it.url} onChange={(e) => patch({ url: e.target.value })} />
                      <IconButton label={`Remove review ${i + 1}`} onClick={() => set('reviews', (o) => ({ ...o, items: o.items.filter((_, j) => j !== i) }))}>
                        <Close size={9} />
                      </IconButton>
                    </div>
                  </div>
                );
              })}
              {rv.items.length < 5 ? (
                <div>
                  <Button size="sm" variant="outline" arrow="none" onClick={() => set('reviews', (o) => ({ ...o, items: [...o.items, { text: '', stars: 5, date: '', url: '' }] }))}>
                    + Add review
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </Section>

      <Section id="videos" gmb={gmb} title="Business Videos" aside="Video thumbnail(s) and the Live View link(s).">
        <div className="flex flex-col gap-5">
          <ImageDrop folder={clientId} label="Video thumbnail" max={2} columns={2} value={gmb.videos.images} onChange={(v) => set('videos', (o) => ({ ...o, images: v }))} />
          <TextArea label="Live View links (one per line)" rows={2} value={gmb.videos.links.join('\n')} onChange={(e) => set('videos', (o) => ({ ...o, links: lines(e.target.value) }))} />
        </div>
      </Section>

      <Section id="rankings" gmb={gmb} aside="Keywords carry over every month; you only update the ranks.">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end gap-5">
            <TextInput className="w-[260px]" label="Location" placeholder="Derry, NH 03038" value={rk.location} onChange={(e) => set('rankings', (o) => ({ ...o, location: e.target.value }))} />
            <div className="flex h-9 items-center">
              <Toggle label={rk.showRanks ? 'Show rankings column' : 'Keywords only (no rankings)'} checked={rk.showRanks} onChange={(v) => set('rankings', (o) => ({ ...o, showRanks: v }))} />
            </div>
            <div className="w-[160px]">
              <StatusSelect label="Status badge" value={rk.status} onChange={(v) => set('rankings', (o) => ({ ...o, status: v }))} />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="t-meta grid grid-cols-[1fr_120px_32px] gap-2 pb-2 uppercase tracking-[0.06em] text-muted">
              <span>Keyword</span>
              <span>{rk.showRanks ? 'Current ranking' : ''}</span>
              <span />
            </div>
            {rk.keywords.map((k, i) => {
              const patch = (p: Partial<typeof k>) => set('rankings', (o) => ({ ...o, keywords: o.keywords.map((x, j) => (j === i ? { ...x, ...p } : x)) }));
              return (
                <div key={i} className="grid grid-cols-[1fr_120px_32px] items-center gap-2 border-t border-line py-1.5">
                  <input aria-label={`Keyword ${i + 1}`} className={inputCls} value={k.keyword} onChange={(e) => patch({ keyword: e.target.value })} />
                  <input aria-label={`Ranking for ${k.keyword || `keyword ${i + 1}`}`} className={cn(inputCls, 'text-center', !rk.showRanks && 'invisible')} value={k.rank} onChange={(e) => patch({ rank: e.target.value })} />
                  <IconButton label={`Remove ${k.keyword || 'keyword'}`} onClick={() => set('rankings', (o) => ({ ...o, keywords: o.keywords.filter((_, j) => j !== i) }))}>
                    <Close size={9} />
                  </IconButton>
                </div>
              );
            })}
            <div className="flex flex-wrap items-start gap-3 border-t border-line pt-3">
              <Button size="sm" variant="outline" arrow="none" onClick={() => set('rankings', (o) => ({ ...o, keywords: [...o.keywords, { keyword: '', rank: '' }] }))}>
                + Add keyword
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <TextArea label="Paste many at once: one per line, “keyword [tab] rank” (replaces the list)" rows={3} value={bulk} onChange={(e) => setBulk(e.target.value)} className="[&_textarea]:font-mono [&_textarea]:text-[12px]" />
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  arrow="none"
                  disabled={!bulk.trim()}
                  onClick={() => {
                    const kws = lines(bulk).map((l) => {
                      const m = l.match(/^(.*?)[\t,;]\s*(\S+)\s*$/) ?? l.match(/^(.*?)\s{2,}(\d+)\s*$/);
                      return m ? { keyword: m[1]!.trim(), rank: m[2]! } : { keyword: l, rank: '' };
                    });
                    set('rankings', (o) => ({ ...o, keywords: kws.slice(0, 60) }));
                    setBulk('');
                  }}
                >
                  Replace keyword list
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="posting" gmb={gmb} title="GMB Posting" aside="4 screenshots per page, in this order.">
        <ImageDrop folder={clientId} label="GMB post screenshots" max={24} value={gmb.posting.images} onChange={(v) => set('posting', { images: v })} />
      </Section>

      <Section id="localSeo" gmb={gmb} aside="One link per line. Empty groups are left out of the report.">
        <div className="flex flex-col gap-5">
          {gmb.localSeo.groups.map((g, i) => {
            const patch = (p: Partial<typeof g>) => set('localSeo', (o) => ({ groups: o.groups.map((x, j) => (j === i ? { ...x, ...p } : x)) }));
            return (
              <div key={i} className="grid grid-cols-1 gap-3 border border-line bg-white p-3">
                <div className="flex items-end gap-2">
                  <TextInput className="flex-1" label="Group title" value={g.title} onChange={(e) => patch({ title: e.target.value })} />
                  <IconButton label={`Remove group ${g.title}`} onClick={() => set('localSeo', (o) => ({ groups: o.groups.filter((_, j) => j !== i) }))}>
                    <Close size={9} />
                  </IconButton>
                </div>
                <TextArea label={`Links (${g.links.length})`} rows={4} value={g.links.join('\n')} onChange={(e) => patch({ links: e.target.value.split(/\r?\n/) })} onBlur={(e) => patch({ links: lines(e.target.value) })} className="[&_textarea]:font-mono [&_textarea]:text-[12px]" />
              </div>
            );
          })}
          <div>
            <Button size="sm" variant="outline" arrow="none" onClick={() => set('localSeo', (o) => ({ groups: [...o.groups, { title: 'New group', links: [] }] }))}>
              + Add group
            </Button>
          </div>
        </div>
      </Section>

      <Section id="backlinks" gmb={gmb} title="Local Backlink Acquisitions" aside="4 screenshots per page, in this order.">
        <ImageDrop folder={clientId} label="Backlink article screenshots" max={24} value={gmb.backlinks.images} onChange={(v) => set('backlinks', { images: v })} />
      </Section>

      <Section id="quora" gmb={gmb} aside="Profile and stats screenshots, plus the Live View link.">
        <div className="flex flex-col gap-5">
          <ImageDrop folder={clientId} label="Quora screenshots" max={3} columns={3} value={gmb.quora.images} onChange={(v) => set('quora', (o) => ({ ...o, images: v }))} />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <TextInput label="Quora profile link" value={gmb.quora.link} onChange={(e) => set('quora', (o) => ({ ...o, link: e.target.value }))} />
            <TextInput label="Link text" placeholder="Business Name - Quora" value={gmb.quora.linkLabel} onChange={(e) => set('quora', (o) => ({ ...o, linkLabel: e.target.value }))} />
          </div>
        </div>
      </Section>
    </div>
  );
}
