import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Close } from './icons';

export const inputCls =
  'h-9 w-full min-w-0 border border-line bg-white px-2.5 text-[13px] text-ink placeholder:text-muted/80 focus:border-ink focus:outline-none focus-visible:outline-[1.5px] focus-visible:outline-accent focus-visible:outline-offset-0 disabled:bg-paper disabled:text-muted';

export function Field({ label, children, hint, error, className, htmlFor }: { label: ReactNode; children: ReactNode; hint?: ReactNode; error?: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="t-meta uppercase tracking-[0.06em] text-muted">
        {label}
      </label>
      {children}
      {error ? <p className="t-meta text-bad">{error}</p> : hint ? <p className="t-meta text-muted">{hint}</p> : null}
    </div>
  );
}

export function TextInput({ label, hint, error, className, id, ...rest }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} className={className} htmlFor={fid}>
      <input id={fid} className={inputCls} aria-invalid={error ? true : undefined} {...rest} />
    </Field>
  );
}

export function SelectInput({ label, className, id, children, ...rest }: { label: ReactNode; className?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field label={label} className={className} htmlFor={fid}>
      <select id={fid} className={cn(inputCls, 'appearance-none bg-[length:8px] bg-[right_10px_center] bg-no-repeat pr-7', 'select-caret')} {...rest}>
        {children}
      </select>
    </Field>
  );
}

export function TextArea({ label, className, id, ...rest }: { label: ReactNode; className?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field label={label} className={className} htmlFor={fid}>
      <textarea id={fid} className={cn(inputCls, 'h-auto min-h-[96px] py-2 leading-relaxed')} {...rest} />
    </Field>
  );
}

/** Range slider + number input pair, clamped to [min, max]. */
export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  suffix = '%',
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  className?: string;
}) {
  const id = useId();
  const set = (raw: string) => {
    const n = Number(raw);
    onChange(Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : min);
  };
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={`${id}-r`} className="flex items-center justify-between text-[12px] text-ink-2">
        <span>{label}</span>
      </label>
      <div className="flex items-center gap-3">
        <input id={`${id}-r`} type="range" className="ro-range flex-1" min={min} max={max} value={value} onChange={(e) => set(e.target.value)} />
        <div className="relative w-[72px]">
          <input
            type="number"
            aria-label={`${label} value`}
            className={cn(inputCls, 't-mono pr-6 text-right')}
            min={min}
            max={max}
            value={value}
            onChange={(e) => set(e.target.value)}
          />
          {suffix ? <span className="t-mono pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted">{suffix}</span> : null}
        </div>
      </div>
    </div>
  );
}

export function NumberInput({ label, value, onChange, min = 0, max, className, warn }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; className?: string; warn?: boolean }) {
  const id = useId();
  return (
    <Field label={label} className={className} htmlFor={id}>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        className={cn(inputCls, 't-mono', warn && 'border-warn')}
        value={value}
        onChange={(e) => {
          const n = Math.round(Number(e.target.value));
          let v = Number.isFinite(n) ? Math.max(min, n) : min;
          if (max !== undefined) v = Math.min(max, v);
          onChange(v);
        }}
      />
    </Field>
  );
}

export function Checkbox({ label, checked, onChange, className }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <label className={cn('inline-flex cursor-pointer select-none items-center gap-2 text-[12px] text-ink-2', className)}>
      <input type="checkbox" className="ro-check" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/** Toggle switch (square). */
export function Toggle({ label, checked, onChange, disabled }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 text-[12px] text-ink"
    >
      <span className={cn('relative inline-block h-[18px] w-[32px] border transition-colors', checked ? 'border-ink bg-ink' : 'border-line bg-white')}>
        <span className={cn('absolute top-[2px] h-3 w-3 transition-all', checked ? 'left-[16px] bg-accent' : 'left-[2px] bg-muted')} />
      </span>
      {label}
    </button>
  );
}

export function TagInput({ label, value, onChange, placeholder = 'Type and press Enter' }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const id = useId();
  const [draft, setDraft] = useState('');
  const add = (raw: string) => {
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !value.includes(s));
    if (parts.length) onChange([...value, ...parts]);
    setDraft('');
  };
  return (
    <Field label={label} htmlFor={id}>
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 border border-line bg-white p-1.5 focus-within:border-ink">
        {value.map((t) => (
          <span key={t} className="inline-flex h-6 items-center gap-1.5 border border-line bg-paper pl-2 text-[12px]">
            {t}
            <button type="button" aria-label={`Remove ${t}`} className="flex h-6 w-6 items-center justify-center text-muted hover:text-ink" onClick={() => onChange(value.filter((x) => x !== t))}>
              <Close size={8} />
            </button>
          </span>
        ))}
        <input
          id={id}
          className="h-6 min-w-[140px] flex-1 bg-transparent px-1 text-[13px] focus:outline-none"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add(draft);
            } else if (e.key === 'Backspace' && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft && add(draft)}
        />
      </div>
    </Field>
  );
}
