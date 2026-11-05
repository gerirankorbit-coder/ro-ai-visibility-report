import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AgencyMark, Button, TextInput } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { useAuth } from './auth';

export function LoginPage() {
  const { session, staff, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const from = (loc.state as { from?: string } | null)?.from ?? '/admin';

  if (!loading && session && staff) return <Navigate to={from} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await sb().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) setError(err.message === 'Invalid login credentials' ? 'Email or password is incorrect.' : err.message);
    else nav(from, { replace: true });
  };

  return (
    <div className="@container flex min-h-screen items-center justify-center bg-paper px-5">
      <div className="w-full max-w-[420px]">
        <div className="mb-10 flex items-center gap-2.5">
          <AgencyMark size={16} />
          <span className="t-meta text-muted">Staff sign in</span>
        </div>
        <h1 className="font-display text-[64px] font-medium leading-[0.92] tracking-[-0.055em]">Rank Orbit</h1>
        <form onSubmit={submit} className="mt-10 flex flex-col gap-5 border-t border-line pt-8" noValidate>
          <TextInput label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextInput label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          {error ? (
            <p role="alert" className="text-[12px] text-bad">
              {error}
            </p>
          ) : null}
          <div className="flex items-center justify-between border-t border-line pt-5">
            <span className="t-meta text-muted">AI Visibility Admin</span>
            <Button type="submit" disabled={busy || !email || !password}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
