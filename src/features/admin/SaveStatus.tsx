import { fmtTime } from '@/lib/format';
import type { SaveState } from './useAutosave';

export function SaveStatus({ state }: { state: SaveState }) {
  const text =
    state.status === 'saving' ? 'Saving…' : state.status === 'saved' && state.at ? `Saved · ${fmtTime(state.at)}` : state.status === 'error' ? `Not saved: ${state.error}` : 'All changes saved';
  return (
    <span role="status" aria-live="polite" className={`t-mono inline-flex items-center gap-1.5 text-[11px] ${state.status === 'error' ? 'text-bad' : 'text-muted'}`}>
      <span className={`inline-block h-[6px] w-[6px] ${state.status === 'saving' ? 'bg-warn' : state.status === 'error' ? 'bg-bad' : 'bg-good'}`} aria-hidden />
      {text}
    </span>
  );
}
