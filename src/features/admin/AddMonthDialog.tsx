import { useEffect, useState } from 'react';
import { Button, Field, Modal, SelectInput, inputCls } from '@/components/ui';
import { monthKey, monthLabel, nextMonthKey } from '@/lib/format';
import type { Month } from '@/types/schema';

export interface AddMonthChoice {
  key: string; // YYYY-MM
  copyFrom: Month | null;
  /** Pre-fill with the starter template (sample baseline values). */
  starter?: boolean;
}

function previousCalendarMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Pick the report month and whether to start from a copy of an existing month (default: latest). */
export function AddMonthDialog({ open, onClose, months, onAdd, busy }: { open: boolean; onClose: () => void; months: Month[]; onAdd: (c: AddMonthChoice) => void; busy: boolean }) {
  const latest = months[months.length - 1] ?? null;
  const suggested = latest ? nextMonthKey(monthKey(latest.period)) : previousCalendarMonth();
  const [key, setKey] = useState(suggested);
  const [source, setSource] = useState<string>(latest?.id ?? 'starter');
  useEffect(() => {
    if (open) {
      setKey(suggested);
      setSource(latest?.id ?? 'starter');
    }
  }, [open, suggested, latest?.id]);

  const exists = months.some((m) => monthKey(m.period) === key);
  const valid = /^\d{4}-\d{2}$/.test(key) && !exists;
  const copyFrom = months.find((m) => m.id === source) ?? null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a report month"
      footer={
        <>
          <Button size="sm" variant="quiet" arrow="none" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" arrow="right" disabled={!valid || busy} onClick={() => onAdd({ key, copyFrom, starter: source === 'starter' })}>
            {busy ? 'Adding…' : `Add ${valid ? monthLabel(key) : 'month'}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Report month" htmlFor="add-month" error={exists ? `${monthLabel(key)} already exists. Pick it from the month list instead.` : undefined}>
          <input id="add-month" type="month" className={inputCls} value={key} onChange={(e) => setKey(e.target.value)} />
        </Field>
        <SelectInput label="Start from" value={source} onChange={(e) => setSource(e.target.value)}>
          {months
            .slice()
            .reverse()
            .map((m) => (
              <option key={m.id} value={m.id}>
                Copy of {monthLabel(monthKey(m.period))}
                {m.id === latest?.id ? ' (latest, recommended)' : ''}
              </option>
            ))}
          <option value="starter">Starter template (sample baseline values)</option>
          <option value="blank">Blank month (all zeros)</option>
        </SelectInput>
        <p className="text-[12px] leading-relaxed text-ink-2">
          {copyFrom
            ? `All numbers, listings and community data are copied from ${monthLabel(monthKey(copyFrom.period))}, so you only change what moved this month. The highlight note starts empty and the month starts as a draft.`
            : source === 'starter'
              ? 'Fills the month with sample baseline numbers (different each time), like a typical first report. The month is marked “Starter values” until you replace them with real numbers.'
              : 'Every value starts at zero and all 12 standard directories are listed as Queued.'}
        </p>
      </div>
    </Modal>
  );
}
