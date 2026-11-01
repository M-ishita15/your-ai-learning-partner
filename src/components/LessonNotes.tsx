import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Clock, FilePenLine, Pencil, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { deleteNote, listNotes, saveNote, summarizeNotes } from '@/lib/notes.functions';
import { fmt } from '@/lib/time';

type Note = Awaited<ReturnType<typeof listNotes>>[number];

export function LessonNotes({ lessonId, now, watched, onSeek }: { lessonId: string; now: number; watched: number; onSeek: (time: number) => void }) {
  const load = useServerFn(listNotes), save = useServerFn(saveNote), remove = useServerFn(deleteNote), summarize = useServerFn(summarizeNotes);
  const qc = useQueryClient();
  const key = ['lesson-notes', lessonId];
  const notes = useQuery({ queryKey: key, queryFn: () => load({ data: { lessonId } }) });
  const [id, setId] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [position, setPosition] = useState(0);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  function changeDraft(note?: Note) {
    if (dirty && !window.confirm('Discard your unsaved note changes?')) return;
    setId(note?.id); setTitle(note?.title ?? ''); setBody(note?.body ?? '');
    setPosition(note?.position_sec ?? Math.floor(now)); setDirty(false);
  }

  async function saveDraft() {
    setBusy(true);
    try {
      await save({ data: { id, lessonId, title, body, position } });
      setId(undefined); setTitle(''); setBody(''); setDirty(false);
      await qc.invalidateQueries({ queryKey: key }); toast.success('Note saved.');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save your note.'); }
    finally { setBusy(false); }
  }

  async function createSummary() {
    setBusy(true);
    try {
      const draft = await summarize({ data: { lessonId } });
      setId(undefined); setTitle(draft.title); setBody(draft.body); setPosition(draft.position); setDirty(true);
      toast.success(`Summary ready · through ${fmt(draft.coveredUntil)}`);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not create a summary.'); }
    finally { setBusy(false); }
  }

  return <section className="border-t pt-6" aria-label="Lesson notes">
    <div className="flex items-center justify-between gap-3">
      <div><p className="eyebrow">Your notebook</p><h2 className="mt-1 flex items-center gap-2 text-xl font-extrabold"><FilePenLine className="h-5 w-5 text-teal" />Lesson notes</h2></div>
      <Button variant="ghost" size="icon" aria-label="New note" title="New note" disabled={busy} onClick={() => changeDraft()}><Plus className="h-4 w-4" /></Button>
    </div>
    <div className="mt-4 space-y-3">
      <Input aria-label="Note title" placeholder="Note title" maxLength={120} value={title} disabled={busy} onChange={e => { setTitle(e.target.value); setDirty(true); }} />
      <Textarea aria-label="Note text" placeholder="Your thoughts, questions, and key ideas…" className="min-h-36 resize-y bg-background" maxLength={12000} value={body} disabled={busy} onChange={e => { setBody(e.target.value); setDirty(true); }} />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" disabled={busy} onClick={() => { setPosition(Math.floor(now)); setBody(b => `${b}${b ? '\n' : ''}[${fmt(now)}] `); setDirty(true); }}><Clock className="h-3.5 w-3.5" />{fmt(now)}</Button>
        <Button variant="outline" size="sm" disabled={busy || watched === 0 || body.trim().length > 0} title="Create a summary in an empty note" onClick={createSummary}><Sparkles className="h-3.5 w-3.5" />{busy ? 'Working…' : 'AI summary'}</Button>
        <Button size="sm" className="ml-auto" disabled={busy || !body.trim()} onClick={saveDraft}><Save className="h-3.5 w-3.5" />{id ? 'Save changes' : 'Save note'}</Button>
      </div>
      <p className="text-xs text-muted-foreground">Private to you · {dirty ? 'Unsaved changes' : 'Saved notes below'}</p>
    </div>
    <div className="mt-5 space-y-3">
      {notes.isPending && <p className="text-sm text-muted-foreground">Loading notes…</p>}
      {notes.isError && <div className="text-sm text-destructive">Could not load notes. <Button variant="ghost" size="sm" onClick={() => notes.refetch()}>Retry</Button></div>}
      {notes.data?.length === 0 && <p className="py-3 text-sm text-muted-foreground">No notes for this lesson yet.</p>}
      {notes.data?.map(note => <article key={note.id} className="rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 break-words font-bold">{note.title || 'Untitled note'}</h3>
          <div className="flex shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy} aria-label={`Edit ${note.title || 'note'}`} title="Edit note" onClick={() => changeDraft(note)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={deleting !== null} aria-label={`Delete ${note.title || 'note'}`} title="Delete note" onClick={async () => {
              if (!window.confirm('Delete this note?')) return;
              setDeleting(note.id);
              try { await remove({ data: { id: note.id } }); if (id === note.id) { setId(undefined); setTitle(''); setBody(''); setDirty(false); } await qc.invalidateQueries({ queryKey: key }); }
              catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete note.'); }
              finally { setDeleting(null); }
            }}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="mt-1 h-7 px-0 font-mono text-xs text-teal" onClick={() => onSeek(note.position_sec)}><Clock className="h-3 w-3" />{fmt(note.position_sec)}</Button>
        <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{note.body.split(/(\[\d+:\d{2}\])/g).map((part, i) => {
          const match = /^\[(\d+):(\d{2})\]$/.exec(part);
          return match ? <Button key={i} variant="link" className="h-auto px-1 py-0 font-mono text-xs" onClick={() => onSeek(Number(match[1]) * 60 + Number(match[2]))}>{part}</Button> : part;
        })}</div>
      </article>)}
    </div>
  </section>;
}