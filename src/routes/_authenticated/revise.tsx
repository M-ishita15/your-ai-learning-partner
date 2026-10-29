import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Mic, Square, RotateCw, Layers } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useSpeech } from '@/hooks/useSpeech';
import { loadLesson, loadStats } from '@/lib/learning';
import { explainBack } from '@/lib/practice.functions';
import { supabase } from '@/integrations/supabase/client';
import { fmt, SEED_LESSON_ID } from '@/lib/time';
export const Route = createFileRoute('/_authenticated/revise')({
  head: () => ({ meta: [{ title: 'Revision desk · Coherence' }, { name: 'description', content: 'Revisit due topics, explain concepts in your own words, and practice recall.' }, { property: 'og:title', content: 'Revision desk · Coherence' }, { property: 'og:description', content: 'A private revision queue grounded in lesson evidence.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: Revise,
});
function Revise() {
  const qc = useQueryClient(), grade = useServerFn(explainBack);
  const stats = useQuery({ queryKey: ['stats'], queryFn: () => loadStats() });
  const [lessonId, setLessonId] = useState(SEED_LESSON_ID), [topicId, setTopicId] = useState(''), [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false), [feedback, setFeedback] = useState<Awaited<ReturnType<typeof explainBack>> | null>(null);
  const [card, setCard] = useState(0), [reveal, setReveal] = useState(false), [open, setOpen] = useState(false);
  const lessons = useQuery({ queryKey: ['lessons'], queryFn: async () => { const { data, error } = await supabase.from('lessons').select('id,title'); if (error) throw new Error(error.message); return data ?? []; } });
  const lesson = useQuery({ queryKey: ['lesson', lessonId], queryFn: () => loadLesson(lessonId) });
  const progress = useQuery({ queryKey: ['stats', lessonId], queryFn: () => loadStats(lessonId) });
  const due = stats.data?.due ?? [];
  const topics = (lesson.data?.markers ?? []).filter(m => (lesson.data?.chunks ?? []).some(c => c.start_sec >= m.start_sec && c.end_sec <= (progress.data?.maxWatched ?? 0)));
  const selected = topics.find(m => m.id === topicId) ?? topics[0];
  const flash = topics[card % Math.max(1, topics.length)];
  const speech = useSpeech(text => setAnswer(a => `${a}${a ? ' ' : ''}${text}`));
  return <AppShell crumb="Revision desk" wide>
    <p className="eyebrow">Return to the ideas that need another pass</p><h1 className="mt-2 text-4xl font-extrabold">Revision desk</h1>
    <section className="mt-6 border-b pb-6"><div className="flex justify-between gap-3"><h2 className="text-xl font-bold">Needs another look</h2><span className="text-sm text-muted-foreground">{due.length} in your queue</span></div>
      {stats.isLoading ? <div className="mt-4 h-16 animate-pulse rounded bg-muted" /> : stats.isError ? <p role="alert" className="mt-3 text-destructive">Could not load your revision queue.</p> : !due.length ? <p className="mt-4 text-sm text-muted-foreground">Nothing due. Your missed topics will appear here.</p> : <div className="mt-3 divide-y">{due.map(d => <div key={d.id} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0"><b>{d.topic_markers?.title ?? 'Lesson topic'}</b><p className="text-sm text-muted-foreground">{fmt(d.topic_markers?.start_sec ?? 0)}</p></div><Button asChild variant="secondary"><Link to="/workspace" search={{ lesson: d.topic_markers?.lesson_id, t: d.topic_markers?.start_sec ?? 0 }}>Revisit →</Link></Button></div>)}</div>}
    </section>
    <label className="mt-6 block text-sm font-semibold">Lesson<select aria-label="Revision lesson" value={lessonId} onChange={e => { setLessonId(e.target.value); setTopicId(''); setFeedback(null); setCard(0); setReveal(false); }} className="mt-2 block max-w-full rounded-lg border bg-card p-3">{lessons.data?.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</select></label>
    <div className="mt-6 grid gap-8 lg:grid-cols-2">
      <section><p className="eyebrow">Explain it back</p><h2 className="mt-2 text-xl font-bold">In your own words.</h2>{!topics.length ? <p className="mt-4 text-muted-foreground">Watch a topic first, then return to explain it.</p> : <form className="mt-4" onSubmit={async e => { e.preventDefault(); if (!selected) return; setBusy(true); try { setFeedback(await grade({ data: { lessonId, topicId: selected.id, answer } })); await qc.invalidateQueries({ queryKey: ['stats'] }); } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not grade your explanation.'); } finally { setBusy(false); } }}>
        <select aria-label="Concept to explain" value={selected?.id} onChange={e => { setTopicId(e.target.value); setFeedback(null); }} className="w-full rounded-lg border bg-card p-3">{topics.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select>
        <textarea aria-label="Your explanation" required minLength={2} maxLength={6000} value={answer} onChange={e => setAnswer(e.target.value)} className="mt-3 min-h-40 w-full rounded-lg border bg-card p-3" placeholder="Explain the concept…" />
        <div className="mt-3 flex justify-between gap-3"><Button type="button" variant="outline" size="icon" aria-label={speech.listening ? 'Stop microphone' : 'Voice explanation'} disabled={!speech.supported || busy} title="Voice explanation" onClick={speech.toggle}>{speech.listening ? <Square /> : <Mic />}</Button><Button disabled={busy || answer.trim().length < 2}>{busy ? 'Reviewing…' : 'Check explanation'}</Button></div>
      </form>}
      {feedback && <div className="mt-5 border-l-2 border-teal pl-4"><b>{feedback.score}/5</b><p className="mt-2">{feedback.feedback}</p><blockquote className="mt-3 text-sm">Your words: “{feedback.evidence}”</blockquote><blockquote className="mt-2 text-sm text-muted-foreground">Transcript: “{feedback.transcript_evidence}”</blockquote><p className="mt-3 text-sm">{feedback.tip}</p></div>}
      </section>
      <section><p className="eyebrow">Flashcard moment</p><h2 className="mt-2 text-xl font-bold">Bring the idea to mind.</h2>{flash ? <><p className="mt-3 text-sm text-muted-foreground">{topics.length} card{topics.length === 1 ? '' : 's'} from what you've watched.</p><Button className="mt-4" onClick={() => { setReveal(false); setOpen(true); }}><Layers />Open flashcards</Button></> : <p className="mt-4 text-muted-foreground">No watched topics yet.</p>}</section>
      <Dialog open={open && !!flash} onOpenChange={setOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Flashcard {(card % Math.max(1, topics.length)) + 1} of {topics.length}</DialogTitle><DialogDescription>Tap the card to flip it.</DialogDescription></DialogHeader>
        {flash && <button type="button" aria-label={reveal ? 'Show question' : 'Show answer'} onClick={() => setReveal(r => !r)} className="flip-card block h-64 w-full text-left"><div className={`flip-inner h-full ${reveal ? 'is-flipped' : ''}`}><div className="flip-face hero-panel grid place-items-center p-6 text-center"><div><p className="eyebrow">Question</p><h3 className="mt-3 text-xl font-bold">How would you explain {flash.title.toLowerCase()}?</h3></div></div><div className="flip-face flip-back card-soft overflow-y-auto p-6"><p className="eyebrow">Answer</p><p className="mt-3">{flash.summary}</p></div></div></button>}
        <div className="flex flex-wrap justify-between gap-3">{flash && <Button asChild variant="link" className="px-0"><Link to="/workspace" search={{ lesson: lessonId, t: flash.start_sec }}>Watch at {fmt(flash.start_sec)} →</Link></Button>}<Button variant="outline" onClick={() => { setReveal(false); setTimeout(() => setCard(c => c + 1), reveal ? 300 : 0); }}><RotateCw />Next card</Button></div>
      </DialogContent></Dialog>
    </div>
  </AppShell>;
}
