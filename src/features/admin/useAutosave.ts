import { useEffect, useRef, useState } from 'react';

export type SaveState = { status: 'idle' | 'saving' | 'saved' | 'error'; at: Date | null; error?: string };

/**
 * Debounced autosave. Calls `save(value)` 600ms after the last change. Skips the
 * initial value and values equal to the last saved one. Flushes on unmount.
 * Changing `resetKey` re-baselines without saving (e.g. switching months).
 */
export function useAutosave<T>(value: T, save: (v: T) => Promise<unknown>, { delay = 600, resetKey }: { delay?: number; resetKey?: string } = {}) {
  const [state, setState] = useState<SaveState>({ status: 'idle', at: null });
  const last = useRef<string>(JSON.stringify(value));
  const key = useRef(resetKey);
  const pending = useRef<T | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const run = async (v: T) => {
    const s = JSON.stringify(v);
    if (s === last.current) return;
    setState((p) => ({ ...p, status: 'saving' }));
    try {
      await saveRef.current(v);
      last.current = s;
      pending.current = null;
      setState({ status: 'saved', at: new Date() });
    } catch (e) {
      setState({ status: 'error', at: null, error: e instanceof Error ? e.message : 'Save failed' });
    }
  };

  useEffect(() => {
    if (key.current !== resetKey) {
      key.current = resetKey;
      last.current = JSON.stringify(value);
      pending.current = null;
      setState({ status: 'idle', at: null });
      return;
    }
    if (JSON.stringify(value) === last.current) return;
    pending.current = value;
    const t = window.setTimeout(() => void run(value), delay);
    return () => window.clearTimeout(t);
  }, [value, resetKey, delay]);

  useEffect(
    () => () => {
      if (pending.current !== null) void saveRef.current(pending.current);
    },
    [],
  );

  return state;
}
