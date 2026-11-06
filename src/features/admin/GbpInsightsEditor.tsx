import { useState } from 'react';
import { Button, NumberInput, TextArea, TextInput, Toggle } from '@/components/ui';
import { parseRows } from '@/lib/paste';
import { DAY_NAMES, type GbpSummary } from '@/types/schema';

type Rows = Array<{ date: string; values: number[] }>;

function PasteBox({ label, colNames, cols, current, onApply }: { label: string; colNames: string[]; cols: number; current: Array<{ date: string } & Record<string, unknown>>; onApply: (r: Rows) => void }) {
  const [text, setText] = useState('');
  const parsed = text.trim() ? parseRows(text, cols) : [];
  const first = current[0]?.date;
  const last = current[current.length - 1]?.date;
  return (
    <div className="flex flex-col gap-2 border border-line bg-white p-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] font-bold">{label}</span>
        <span className="text-[11.5px] text-muted">{current.length ? `Saved: ${current.length} days (${first} – ${last})` : 'No data yet'}</span>
      </div>
      <TextArea
        label={`Paste rows: Date, ${colNames.join(', ')}`}
        rows={4}
        value={text}
        placeholder={`Oct 6\t${colNames.map((_, i) => i + 1).join('\t')}\nOct 7\t${colNames.map(() => 0).join('\t')}`}
        onChange={(e) => setText(e.target.value)}
        className="[&_textarea]:font-mono [&_textarea]:text-[12px]"
      />
      <div className="flex flex-wrap items-center gap-3 text-[12px]">
        <Button size="sm" variant="outline" arrow="none" disabled={!parsed.length} onClick={() => (onApply(parsed), setText(''))}>
          {parsed.length ? `Use these ${parsed.length} days` : 'Paste rows above'}
        </Button>
        {text.trim() && !parsed.length ? <span className="text-bad">No rows recognised. Each line needs a date and {cols} numbers.</span> : null}
        {current.length ? (
          <button type="button" className="text-bad underline underline-offset-2" onClick={() => onApply([])}>
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Manual data for the Views / Actions / Phone calls charts under the GBP Summary tiles. */
export function GbpInsightsEditor({ data, onChange }: { data: GbpSummary; onChange: (fn: (d: GbpSummary) => GbpSummary) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-5">
        <div className="flex h-9 items-center">
          <Toggle label={data.showInsights ? 'Charts shown under the tiles' : 'Charts hidden (tiles only)'} checked={data.showInsights} onChange={(v) => onChange((d) => ({ ...d, showInsights: v }))} />
        </div>
      </div>
      {data.showInsights ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput label="Last Updated (text)" placeholder="5th Nov 2026 at 22:21:47" value={data.updated} onChange={(e) => onChange((d) => ({ ...d, updated: e.target.value }))} />
            <TextInput label="Date range label" placeholder="Last 30 Days" value={data.range} onChange={(e) => onChange((d) => ({ ...d, range: e.target.value }))} />
          </div>
          <PasteBox
            label="Views"
            cols={4}
            colNames={['Search Desktop', 'Search Mobile', 'Maps Desktop', 'Maps Mobile']}
            current={data.views}
            onApply={(r) => onChange((d) => ({ ...d, views: r.slice(0, 62).map(({ date, values: [sd, sm, md, mm] }) => ({ date, sd: sd!, sm: sm!, md: md!, mm: mm! })) }))}
          />
          <PasteBox
            label="Actions"
            cols={3}
            colNames={['Website clicks', 'Request direction', 'Call you']}
            current={data.actions}
            onApply={(r) => onChange((d) => ({ ...d, actions: r.slice(0, 62).map(({ date, values: [web, dir, call] }) => ({ date, web: web!, dir: dir!, call: call! })) }))}
          />
          <div className="border border-line bg-white p-3">
            <div className="mb-2 text-[12.5px] font-bold">Phone calls by weekday</div>
            <div className="grid grid-cols-7 gap-2">
              {DAY_NAMES.map((day, i) => (
                <NumberInput key={day} label={day} value={data.calls[i] ?? 0} onChange={(v) => onChange((d) => ({ ...d, calls: d.calls.map((c, j) => (j === i ? v : c)) }))} />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
