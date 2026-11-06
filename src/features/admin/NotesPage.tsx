import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button, Field, TextArea, TextInput, inputCls, useToast } from '@/components/ui';
import { deleteNote, listNotes, saveNote } from '@/lib/api';
import { monthKey, monthLabel } from '@/lib/format';
import type { Note } from '@/types/gmb';
import { AdminLayout } from './AdminLayout';
import { ImageDrop, SHARED_MEDIA_FOLDER } from './ImageDrop';

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const blank = (key: string): Note => ({
  period: `${key}-01`,
  title: 'Google Core Update',
  image_path: null,
  body: `Google has started rolling out its **${monthLabel(key)} Core Update**.\n\nYou may notice some temporary changes in your website’s rankings during this period. This is a normal part of Google’s update process as search results adjust. Please note that your Google Maps rankings may also fluctuate during this time.\n\nWe want to assure you that our SEO team is closely monitoring the situation to ensure your website maintains strong performance.`,
  link: '',
});

/** Monthly Google update note, shared by every client's report for that month. */
export default function NotesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const notes = useQuery({ queryKey: ['notes'], queryFn: listNotes });
  const [key, setKey] = useState(thisMonth());
  const existing = notes.data?.find((n) => monthKey(n.period) === key) ?? null;
  const [draft, setDraft] = useState<Note>(blank(key));
  useEffect(() => {
    setDraft(existing ?? blank(key));
  }, [key, existing]);

  const save = useMutation({
    mutationFn: () => saveNote(draft),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notes'] });
      void qc.invalidateQueries({ queryKey: ['note', draft.period] });
      toast(`Google update note for ${monthLabel(key)} saved`);
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Could not save'),
  });
  const del = useMutation({
    mutationFn: () => deleteNote(draft.period),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notes'] });
      toast('Note deleted');
    },
  });

  return (
    <AdminLayout crumbs="Google updates">
      <div className="pb-8 pt-10">
        <Link to="/admin" className="t-meta text-muted hover:text-ink">
          ← All clients
        </Link>
        <h1 className="font-display mt-3 text-[44px] font-bold leading-none tracking-[-0.03em]">Google updates</h1>
        <p className="mt-3 max-w-[70ch] text-[13px] text-ink-2">
          Write the Google update note once per month. It appears as the first page in every client&apos;s report for that month (when the “Google Update” section is on).
        </p>
      </div>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr]">
        <aside>
          <Field label="Month" htmlFor="note-month">
            <input id="note-month" type="month" className={inputCls} value={key} onChange={(e) => e.target.value && setKey(e.target.value)} />
          </Field>
          <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">Saved notes</div>
          <ul className="mt-2 border-t border-line">
            {(notes.data ?? []).map((n) => (
              <li key={n.period} className="border-b border-line">
                <button type="button" className={`w-full px-1 py-2 text-left text-[13px] ${monthKey(n.period) === key ? 'font-bold' : ''}`} onClick={() => setKey(monthKey(n.period))}>
                  {monthLabel(monthKey(n.period))} <span className="text-muted">· {n.title}</span>
                </button>
              </li>
            ))}
            {notes.data && !notes.data.length ? <li className="py-2 text-[12px] text-muted">None yet.</li> : null}
          </ul>
        </aside>
        <section className="flex flex-col gap-5">
          <TextInput label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <ImageDrop
            folder={SHARED_MEDIA_FOLDER}
            label="Screenshot (Google Search Status Dashboard)"
            max={1}
            columns={2}
            value={draft.image_path ? [draft.image_path] : []}
            onChange={(v) => setDraft({ ...draft, image_path: v[0] ?? null })}
          />
          <TextArea label="Note text (blank line = new paragraph, **text** = bold)" rows={10} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          <TextInput label="Official update link (“here”)" placeholder="https://status.search.google.com/…" value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} />
          <div className="flex items-center gap-3 border-t border-line pt-5">
            <Button onClick={() => save.mutate()} disabled={save.isPending} arrow="none">
              {save.isPending ? 'Saving…' : existing ? 'Save changes' : `Save note for ${monthLabel(key)}`}
            </Button>
            {existing ? (
              <Button variant="quiet" arrow="none" onClick={() => del.mutate()} disabled={del.isPending}>
                Delete note
              </Button>
            ) : null}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
