import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

const Ctx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number>();
  const show = useCallback((m: string) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 2400);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div aria-live="polite" role="status" className="no-capture pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
        {msg ? <div className="t-mono bg-ink px-4 py-2.5 text-[11px] text-white">{msg}</div> : null}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
