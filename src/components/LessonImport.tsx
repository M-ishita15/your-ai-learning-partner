import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Plus, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { importLesson } from '@/lib/practice.functions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEED_LESSON_ID } from '@/lib/time';
export function LessonImport() {
  const { user } = useAuth();
  const navigate = useNavigate(), qc = useQueryClient(), ingest = useServerFn(importLesson);
  const [open, setOpen] = useState(false), [replace, setReplace] = useState(false), [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(''), [source, setSource] = useState(''), [youtube, setYoutube] = useState(''), [transcript, setTranscript] = useState('');
  const admin = useQuery({ queryKey: ['admin', user?.id], enabled: Boolean(user), queryFn: async () => (await supabase.rpc('has_role', { _user_id: user?.id ?? '', _role: 'admin' })).data ?? false });
  if (!user) return null;
  return <div className="mt-5"><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => { setOpen(true); setReplace(false); }}><Plus />Add your own lesson</Button>{admin.data && <Button variant="outline" onClick={() => { setOpen(true); setReplace(true); setTitle('Quantum mechanics as a framework'); }}>Replace sample transcript</Button>}</div>
    {open && <section className="mt-5 border-y py-6"><div className="flex justify-between gap-3"><h2 className="text-xl font-bold">{replace ? 'Replace sample transcript' : 'Add your own lesson'}</h2><Button variant="ghost" size="icon" aria-label="Close lesson form" disabled={busy} onClick={() => setOpen(false)}><X /></Button></div><form className="mt-4 grid max-w-3xl gap-3" onSubmit={async e => { e.preventDefault(); setBusy(true); try { const id = await ingest({ data: { title, source, youtube, transcript, replaceId: replace ? SEED_LESSON_ID : null } }); await qc.invalidateQueries({ queryKey: ['lesson'] }); await qc.invalidateQueries({ queryKey: ['lessons'] }); setOpen(false); toast.success('Lesson saved.'); navigate({ to: '/workspace', search: { lesson: id, t: 0 } }); } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not save lesson.'); } finally { setBusy(false); } }}>
      <label className="text-sm font-semibold">Lesson title<input required minLength={2} maxLength={200} value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-lg border bg-card p-3" /></label>
      <label className="text-sm font-semibold">Source<input maxLength={200} value={source} onChange={e => setSource(e.target.value)} className="mt-1 block w-full rounded-lg border bg-card p-3" /></label>
      <label className="text-sm font-semibold">YouTube link (optional)<input type="url" value={youtube} onChange={e => setYoutube(e.target.value)} className="mt-1 block w-full rounded-lg border bg-card p-3" /></label>
      <label className="text-sm font-semibold">Timestamped transcript<textarea required maxLength={120000} placeholder="0:00 The lesson begins…" value={transcript} onChange={e => setTranscript(e.target.value)} className="mt-1 block min-h-48 w-full rounded-lg border bg-card p-3 font-mono text-sm" /></label>
      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-teal"><Upload className="h-4 w-4" />Upload SRT / VTT<input type="file" accept=".srt,.vtt,.txt" className="max-w-full text-xs" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 500000) { toast.error('Choose a transcript smaller than 500 KB.'); return; } setTranscript(await file.text()); }} /></label>
      <Button disabled={busy} className="justify-self-start">{busy ? 'Preparing lesson…' : 'Save lesson'}</Button>
    </form></section>}
  </div>;
}
