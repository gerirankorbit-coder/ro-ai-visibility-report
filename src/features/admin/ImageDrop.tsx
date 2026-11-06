import { useRef, useState } from 'react';
import { Close, useToast } from '@/components/ui';
import { deleteMedia, mediaUrl, uploadMedia } from '@/lib/api';
import { cn } from '@/lib/cn';

/** Folder used for screenshots that belong to no client (the shared Google update note). */
export const SHARED_MEDIA_FOLDER = '00000000-0000-0000-0000-000000000000';

/**
 * Drag-and-drop / click-to-pick screenshot list. Uploads each file to the private bucket and
 * calls onChange with the new list of storage paths. Images can be reordered and removed.
 */
export function ImageDrop({ folder, value, onChange, max = 24, label, hint, columns = 4 }: { folder: string; value: string[]; onChange: (v: string[]) => void; max?: number; label: string; hint?: string; columns?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [over, setOver] = useState(false);
  const toast = useToast();
  const latest = useRef(value);
  latest.current = value;

  const add = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const room = max - latest.current.length;
    if (!list.length) return;
    if (room <= 0) {
      toast(`Up to ${max} images here.`);
      return;
    }
    const take = list.slice(0, room);
    if (list.length > room) toast(`Only the first ${room} image(s) were added (limit ${max}).`);
    setBusy((b) => b + take.length);
    for (const f of take) {
      try {
        const path = await uploadMedia(folder, f);
        latest.current = [...latest.current, path];
        onChange(latest.current);
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setBusy((b) => b - 1);
      }
    }
  };

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="t-meta uppercase tracking-[0.06em] text-muted">{label}</span>
        <span className="text-[11px] text-muted">
          {value.length}/{max}
        </span>
      </div>
      {value.length ? (
        <ul className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {value.map((p, i) => (
            <li key={p} className="group relative border border-line bg-white">
              <img src={mediaUrl(p)} alt={`${label} ${i + 1}`} className="block aspect-square w-full object-contain" loading="lazy" />
              <div className="absolute inset-x-0 top-0 flex justify-between bg-white/90 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <span className="flex">
                  <button type="button" className="px-2 py-1 text-[11px] disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move image ${i + 1} earlier`}>
                    ←
                  </button>
                  <button type="button" className="px-2 py-1 text-[11px] disabled:opacity-30" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label={`Move image ${i + 1} later`}>
                    →
                  </button>
                </span>
                <button
                  type="button"
                  className="px-2 py-1 text-bad"
                  aria-label={`Remove image ${i + 1}`}
                  onClick={() => {
                    onChange(value.filter((x) => x !== p));
                    void deleteMedia(p);
                  }}
                >
                  <Close size={9} />
                </button>
              </div>
              <span className="absolute bottom-1 left-1 bg-black/70 px-1.5 text-[10px] text-white">{i + 1}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {value.length < max ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            void add(e.dataTransfer.files);
          }}
          onPaste={(e) => void add(Array.from(e.clipboardData.files))}
          className={cn('flex h-20 flex-col items-center justify-center gap-1 border border-dashed text-[12px] transition-colors', over ? 'border-accent bg-[#F3E8FF]' : 'border-[#BDBDBD] bg-white hover:border-ink')}
        >
          <span className="font-semibold">{busy ? `Uploading ${busy}…` : 'Drop screenshots here or click to choose'}</span>
          <span className="text-[11px] text-muted">{hint ?? 'PNG or JPG. You can select several at once.'}</span>
        </button>
      ) : null}
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={max > 1}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files) void add(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
