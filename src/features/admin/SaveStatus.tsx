import { Button } from '@/components/ui';
import { fmtTime } from '@/lib/format';
import type { SaveState } from './useAutosave';

/** Save button + status. Changes also save automatically; the button saves immediately. */
export function SaveStatus({ state, onSave, label = 'Save' }: { state: SaveState; onSave?: () => void; label?: string }) {
  const text =
    state.status === 'saving'
      ? 'Saving…'
      : state.status === 'dirty'
        ? 'Unsaved changes'
        : state.status === 'saved' && state.at
          ? `Saved to database · ${fmtTime(state.at)}`
          : state.status === 'error'
            ? `Not saved: ${state.error}`
            : 'All changes saved';
  const dot = state.status === 'saving' || state.status === 'dirty' ? 'bg-warn' : state.status === 'error' ? 'bg-bad' : 'bg-good';
  return (
    <span className="inline-flex items-center gap-3">
      <span role="status" aria-live="polite" className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium ${state.status === 'error' ? 'text-bad' : 'text-ink-2'}`}>
        <span className={`inline-block h-[7px] w-[7px] rounded-full ${dot}`} aria-hidden />
        {text}
      </span>
      {onSave ? (
        <Button size="sm" arrow="none" onClick={onSave} disabled={state.status === 'saving'}>
          {state.status === 'saving' ? 'Saving…' : label}
        </Button>
      ) : null}
    </span>
  );
}
