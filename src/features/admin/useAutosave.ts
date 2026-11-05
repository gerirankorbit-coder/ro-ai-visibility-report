import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveState = { status: 'idle' | 'dirty' | 'saving' | 'saved' | 'error'; at: Date | null; error?: string };

/**
 * Saves to the database 600ms after the last change, and on demand with `saveNow()` (the Save
 * button). Skips the initial value and values equal to the last saved one. Warns before leaving
 * the page with unsaved changes. Changing `resetKey` re-baselines without saving (switching months).
 */
export function useAutosave<T>(value: T, save: (v: T) => Promise<unknown>, { delay = 600, resetKey }: { delay?: number; resetKey?: string } = {}) {
  const [state, setState] = useState<SaveState>({ status: 'idle', at: null });
  const last = useRef<string>(JSON.stringify(value));
  const key = useRef(resetKey);
  const latest = useRef(value);
  const saveRef = useRef(save);
  const timer = useRef<number>();
  saveRef.current = save;
  latest.current = value;

  const run = useCallback(async (v: T) => {
    const s = JSON.stringify(v);
    if (s === last.current) {
      setState((p) => (p.status === 'dirty' ? { status: 'saved', at: p.at ?? new Date() } : p));
      return true;
    }
    setState((p) => ({ ...p, status: 'saving' }));
    try {
      await saveRef.current(v);
      last.current = s;
      setState({ status: JSON.stringify(latest.current) === s ? 'saved' : 'dirty', at: new Date() });
      return true;
    } catch (e) {
      setState({ status: 'error', at: null, error: e instanceof Error ? e.message : 'Save failed' });
      return false;
    }
  }, []);

  useEffect(() => {
    if (key.current !== resetKey) {
      key.current = resetKey;
      last.current = JSON.stringify(value);
      setState({ status: 'idle', at: null });
      return;
    }
    if (JSON.stringify(value) === last.current) return;
    setState((p) => (p.status === 'saving' ? p : { ...p, status: 'dirty' }));
    timer.current = window.setTimeout(() => void run(value), delay);
    return () => window.clearTimeout(timer.current);
  }, [value, resetKey, delay, run]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(latest.current) !== last.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, []);

  // Flush on unmount (navigating inside the app).
  useEffect(
    () => () => {
      if (JSON.stringify(latest.current) !== last.current) void saveRef.current(latest.current);
    },
    [],
  );

  const saveNow = useCallback(() => {
    window.clearTimeout(timer.current);
    return run(latest.current);
  }, [run]);

  return { ...state, saveNow };
}
