import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Checkbox, Field, TagInput, TextInput, inputCls, useToast } from '@/components/ui';
import { logoDataUrl, updateClientRow, uploadLogo, validateLogo } from '@/lib/api';
import { clientToInput } from '@/lib/defaults';
import { initials } from '@/lib/format';
import type { Client, ClientInput, HoursDay } from '@/types/schema';
import { useAutosave } from './useAutosave';
import { SaveStatus } from './SaveStatus';

function Group({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-6 border-t border-line py-8 lg:grid-cols-12">
      <div className="lg:col-span-3">
        <h2 className="flex items-center gap-2 text-[11px] font-medium">
          <span className="inline-block h-[6px] w-[6px] bg-red" aria-hidden />
          {title}
        </h2>
        {aside ? <div className="mt-2 text-[12px] text-muted">{aside}</div> : null}
      </div>
      <div className="lg:col-span-9">{children}</div>
    </section>
  );
}
export { Group as FormGroup };

export function BusinessInfoForm({ client }: { client: Client }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState<ClientInput>(() => clientToInput(client));
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoErr, setLogoErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void logoDataUrl(draft.logo_path).then(setLogoUrl);
  }, [draft.logo_path]);

  const state = useAutosave(draft, async (v) => {
    const saved = await updateClientRow(client.id, v);
    qc.setQueryData(['client', client.id], saved);
    void qc.invalidateQueries({ queryKey: ['clients'] });
  });

  const set = <K extends keyof ClientInput>(k: K, v: ClientInput[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setHours = (i: number, patch: Partial<HoursDay>) => setDraft((d) => ({ ...d, hours: d.hours.map((h, j) => (j === i ? { ...h, ...patch } : h)) }));

  const onLogo = async (file: File | undefined) => {
    if (!file) return;
    setLogoErr(null);
    const err = await validateLogo(file);
    if (err) {
      setLogoErr(err);
      return;
    }
    setUploading(true);
    try {
      const path = await uploadLogo(client.id, file);
      set('logo_path', path);
      toast('Logo uploaded');
    } catch (e) {
      setLogoErr(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="flex justify-end py-4">
        <SaveStatus state={state} />
      </div>
      <Group title="Business" aside="Shown in the report header and the business profile.">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextInput className="md:col-span-2" label="Business name" value={draft.name} onChange={(e) => set('name', e.target.value)} />
          <TextInput className="md:col-span-2" label="Category" placeholder="Plumber · Emergency Plumbing Service" value={draft.category} onChange={(e) => set('category', e.target.value)} />
          <TextInput label="Street address" value={draft.address} onChange={(e) => set('address', e.target.value)} />
          <TextInput label="City, state, ZIP" value={draft.locality} onChange={(e) => set('locality', e.target.value)} />
          <TextInput label="Phone" value={draft.phone} onChange={(e) => set('phone', e.target.value)} />
          <TextInput label="Website" placeholder="example.com" value={draft.website} onChange={(e) => set('website', e.target.value)} />
          <div className="md:col-span-2">
            <TagInput label="Services" value={draft.services} onChange={(v) => set('services', v)} />
          </div>
          <TextInput
            label="Client since"
            type="month"
            value={draft.client_since ? draft.client_since.slice(0, 7) : ''}
            onChange={(e) => set('client_since', e.target.value ? `${e.target.value}-01` : null)}
          />
          <Field label="Brand color" htmlFor="brand-color">
            <div className="flex items-center gap-2">
              <input id="brand-color" type="color" className="h-9 w-12 cursor-pointer border border-line bg-white p-1" value={draft.brand_color} onChange={(e) => set('brand_color', e.target.value.toUpperCase())} />
              <input aria-label="Brand color hex" className={`${inputCls} t-mono`} value={draft.brand_color} onChange={(e) => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && set('brand_color', e.target.value)} />
            </div>
          </Field>
        </div>
      </Group>

      <Group title="Logo" aside="PNG (min 512px) or SVG. Stored privately; clients see a signed link.">
        <div className="flex flex-wrap items-center gap-6">
          {logoUrl ? (
            <img src={logoUrl} alt="Client logo" className="h-20 w-20 border border-line bg-white object-contain" />
          ) : (
            <div className="font-display flex h-20 w-20 items-center justify-center text-[24px] text-white" style={{ background: draft.brand_color }} aria-hidden>
              {initials(draft.name)}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/png,image/svg+xml" className="sr-only" id="logo-file" onChange={(e) => void onLogo(e.target.files?.[0])} />
            <div className="flex gap-3">
              <Button size="sm" variant="outline" arrow="none" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? 'Uploading…' : draft.logo_path ? 'Replace logo' : 'Upload logo'}
              </Button>
              {draft.logo_path ? (
                <Button size="sm" variant="quiet" arrow="none" onClick={() => set('logo_path', null)}>
                  Remove
                </Button>
              ) : null}
            </div>
            {logoErr ? <p className="text-[12px] text-bad">{logoErr}</p> : null}
          </div>
        </div>
      </Group>

      <Group title="Business hours" aside="Mark a day closed to hide its times.">
        <div className="flex flex-col">
          {draft.hours.map((h, i) => (
            <div key={h.day} className="grid grid-cols-[48px_1fr_1fr_auto] items-center gap-3 border-b border-line py-2">
              <span className="t-mono text-[12px]">{h.day}</span>
              <input aria-label={`${h.day} opens`} className={inputCls} placeholder="9:00 AM" value={h.open} disabled={h.closed} onChange={(e) => setHours(i, { open: e.target.value })} />
              <input aria-label={`${h.day} closes`} className={inputCls} placeholder="5:00 PM" value={h.close} disabled={h.closed} onChange={(e) => setHours(i, { close: e.target.value })} />
              <Checkbox label="Closed" checked={h.closed} onChange={(v) => setHours(i, { closed: v })} />
            </div>
          ))}
        </div>
      </Group>
    </div>
  );
}
