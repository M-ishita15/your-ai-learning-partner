import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Mic, Square, ArrowRight, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Scorecard } from '@/components/Scorecard';
import { useSpeech } from '@/hooks/useSpeech';
import { supabase } from '@/integrations/supabase/client';
import { loadLesson, loadStats } from '@/lib/learning';
import { startInterview, answerInterview, scoreInterview, shareScorecard } from '@/lib/practice.functions';
import { ScorecardSchema } from '@/lib/lesson-content';
import { SEED_LESSON_ID, fmt } from '@/lib/time';

export const Route = createFileRoute('/_authenticated/interview')({
  validateSearch: (s: Record<string, unknown>) => ({ lesson: typeof s['lesson'] === 'string' ? s['lesson'] : undefined, session: typeof s['session'] === 'string' ? s['session'] : undefined }),
  head: () => ({ meta: [{ title: 'Mock interview · Coherence' }, { name: 'description', content: 'Practice three lesson-based answers and receive a private evidence-backed scorecard.' }, { property: 'og:title', content: 'Mock interview · Coherence' }, { property: 'og:description', content: 'Three questions, your own words, and a clearer next step.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: Interview,
});
function Interview() {
  const search = Route.useSearch();
  const lessonId = search.lesson ?? SEED_LESSON_ID;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const start = useServerFn(startInterview), save = useServerFn(answerInterview), score = useServerFn(scoreInterview), share = useServerFn(shareScorecard);
  const [sessionId, setSessionId] = useState(search.session);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const speech = useSpeech(text => setAnswer(a => `${a}${a ? ' ' : ''}${text}`));
  const lesson = useQuery({ queryKey: ['lesson', lessonId], queryFn: () => loadLesson(lessonId) });
  const stats = useQuery({ queryKey: ['stats', lessonId], queryFn: () => loadStats(lessonId) });
  const session = useQuery({ queryKey: ['interview', sessionId], enabled: Boolean(sessionId), queryFn: async () => {
    const { data, error } = await supabase.from('interview_sessions').select('*').eq('id', sessionId ?? '').single();
    if (error) throw new Error(error.message); return data;
  } });
  const turns = useQuery({ queryKey: ['turns', sessionId], enabled: Boolean(sessionId), queryFn: async () => {
    const { data, error } = await supabase.from('interview_turns').select('*').eq('session_id', sessionId ?? '').order('turn_index');
    if (error) throw new Error(error.message); return data ?? [];
  } });
  const questions = (session.data?.questions ?? []) as { question: string; topic_id: string }[];
  const index = turns.data?.length ?? 0;
  const card = ScorecardSchema.safeParse(session.data?.scorecard);
  async function run(action: () => Promise<void>) { setBusy(true); try { await action(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); } }
  async function finish() { if (!sessionId) return; await score({ data: { sessionId } }); await qc.invalidateQueries({ queryKey: ['interview', sessionId] }); await qc.invalidateQueries({ queryKey: ['stats'] }); }
  return <AppShell crumb="Mock interview" wide>
    <p className="eyebrow">Make the idea your own</p><h1 className="mt-2 text-4xl font-extrabold">Mock interview</h1>
    <p className="mt-3 text-muted-foreground">{lesson.data?.lesson.title} · Watched up to {fmt(stats.data?.maxWatched ?? 0)}</p>
    {!sessionId ? <section className="mt-8 max-w-2xl space-y-5"><h2 className="text-xl font-bold">Three questions. One step closer.</h2><Button disabled={busy} onClick={() => run(async () => { const s = await start({ data: { lessonId } }); setSessionId(s.id); await navigate({ to: "/interview", search: { lesson: lessonId, session: s.id }, replace: true }); })}>{busy ? 'Preparing questions…' : 'Start interview'}<ArrowRight /></Button></section>
      : session.isLoading || turns.isLoading ? <div className="mt-8 h-48 animate-pulse rounded bg-muted" />
      : session.isError || turns.isError ? <p role="alert" className="mt-6 text-destructive">Could not load this interview.</p>
      : card.success ? <><Scorecard card={card.data} lessonId={lessonId} /><div className="mt-6 flex flex-wrap gap-3"><Button variant="outline" disabled={busy} onClick={() => run(async () => { const token = await share({ data: { sessionId } }); const url = `${window.location.origin}/scorecard/${token}`; setShareUrl(url); await navigator.clipboard?.writeText(url).catch(() => undefined); toast.success('Read-only share link ready.'); })}><Share2 />Share scorecard</Button><Button onClick={() => { setSessionId(undefined); setShareUrl(''); navigate({ to: '/interview', search: { lesson: lessonId, session: undefined }, replace: true }); }}>New interview</Button></div>{shareUrl && <a className="mt-3 block break-all text-sm text-teal underline" href={shareUrl}>{shareUrl}</a>}</>
      : index >= 3 ? <section className="mt-8"><h2 className="text-xl font-bold">All three answers are saved.</h2><Button className="mt-4" disabled={busy} onClick={() => run(finish)}>{busy ? 'Reviewing your answers…' : 'Get scorecard'}</Button></section>
      : <section className="mt-8 max-w-3xl"><p className="eyebrow">Question {index + 1} / 3</p><h2 className="mt-3 text-2xl font-bold">{questions[index]?.question}</h2><form className="mt-5" onSubmit={e => { e.preventDefault(); run(async () => { await save({ data: { sessionId, index, answer } }); setAnswer(''); speech.listening && speech.toggle(); await qc.invalidateQueries({ queryKey: ['turns', sessionId] }); if (index === 2) await finish(); }); }}><textarea aria-label="Your interview answer" required minLength={2} maxLength={6000} value={answer} onChange={e => setAnswer(e.target.value)} className="min-h-48 w-full rounded-lg border bg-card p-4" placeholder="Your answer…" /><div className="mt-3 flex items-center justify-between gap-3"><Button type="button" size="icon" variant="outline" aria-label={speech.listening ? 'Stop microphone' : 'Voice answer'} title={speech.supported ? 'Voice answer' : 'Voice input unavailable; type your answer'} disabled={!speech.supported || busy} onClick={speech.toggle}>{speech.listening ? <Square /> : <Mic />}</Button><Button disabled={busy || answer.trim().length < 2}>{busy ? 'Saving…' : index === 2 ? 'Finish interview' : 'Next question'}<ArrowRight /></Button></div></form></section>}
    <Button className="mt-8" asChild variant="link"><Link to="/history">Saved interviews →</Link></Button>
  </AppShell>;
}
