import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isStaff } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface AuthState {
  loading: boolean;
  session: Session | null;
  staff: boolean;
}

const Ctx = createContext<AuthState>({ loading: true, session: null, staff: false });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ loading: true, session: null, staff: false });
  useEffect(() => {
    if (!supabase) {
      setState({ loading: false, session: null, staff: false });
      return;
    }
    let alive = true;
    const apply = async (session: Session | null) => {
      const staff = session ? await isStaff() : false;
      if (alive) setState({ loading: false, session, staff });
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      // Defer to avoid calling Supabase inside the auth callback.
      window.setTimeout(() => void apply(session), 0);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}
