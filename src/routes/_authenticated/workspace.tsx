import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Lock, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { loadLesson, loadStats } from "@/lib/learning";
import { fmt, SEED_LESSON_ID } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { savePlayback, saveReading, submitQuiz } from "@/lib/learning.functions";
import { generatePractice } from "@/lib/practice.functions";
import { askTutor, whereLater, type TutorReply } from "@/lib/tutor.functions";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";

export const Route = createFileRoute("/_authenticated/workspace")({
  validateSearch: (s: Record<string, unknown>) => ({ lesson: typeof s["lesson"] === "string" ? s["lesson"] : undefined, t: typeof s["t"] === "number" ? (s["t"] as number) : undefined }),
  head: () => ({
    meta: [
      { title: "Learning workspace · Coherence" },
      { name: "description", content: "Watch the lecture, practice, and ask the spoiler-proof tutor." },
      { property: "og:title", content: "Learning workspace · Coherence" },
      { property: "og:description", content: "Watch the lecture, practice, and ask the spoiler-proof tutor." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Workspace,
});

function Workspace() {
  const { t, lesson: selected } = Route.useSearch();
  const lessonId = selected ?? SEED_LESSON_ID;
  const savePosition = useServerFn(savePlayback);
  const read = useServerFn(saveReading);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["lesson", lessonId], queryFn: () => loadLesson(lessonId) });
  const stats = useQuery({ queryKey: ["stats", lessonId], queryFn: () => loadStats(lessonId) });
  const { host, player, seek: seekPlayer } = useYouTubePlayer(data?.lesson.youtube_id, t ?? stats.data?.maxWatched ?? 0);
  const [now, setNow] = useState(0);
  const [watched, setWatched] = useState(0);
  const watchedRef = useRef(0);

  useEffect(() => {
    watchedRef.current = stats.data?.maxWatched ?? 0;
    setWatched(watchedRef.current);
  }, [stats.data?.maxWatched, lessonId]);

  useEffect(() => {
    let saving = false;
    let tick = 0;
    const id = setInterval(async () => {
      const cur = Math.floor(player.current?.getCurrentTime?.() ?? 0);
      setNow(cur);
      tick++;
      if (saving || tick % 5 !== 0 || player.current?.getPlayerState?.() !== 1) return;
      saving = true;
      try {
        const position = await savePosition({ data: { lessonId, position: cur } });
        watchedRef.current = position; setWatched(position);
      } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save watch progress."); }
      finally { saving = false; }
    }, 1000);
    return () => clearInterval(id);
  }, [lessonId, savePosition]);

  const seek = (s: number) => { seekPlayer(s); setNow(s); };

  if (!data) return <AppShell crumb="Learning workspace" wide><div className="h-64 animate-pulse rounded-3xl bg-muted" /></AppShell>;
  const { lesson, markers, chunks } = data;
  const marker = [...markers].reverse().find((m) => m.start_sec <= now) ?? markers[0];
  const chunk = lesson.youtube_id ? [...chunks].reverse().find((c) => c.start_sec <= now) ?? chunks[0] : chunks.find(c => c.end_sec > watched) ?? chunks.at(-1);

  return (
    <AppShell crumb="Learning workspace" wide>
      <p className="eyebrow">A continuous learning workspace</p>
      <h1 className="mt-2 text-4xl font-extrabold">Stay with the idea.</h1>
      <p className="mt-2 text-muted-foreground">Move from the lecture to a clearer explanation, practice, and an interview-ready answer.</p>

      <select aria-label="Choose lesson" value={lessonId} className="mt-4 max-w-full rounded-lg border bg-card p-3" onChange={e => { window.location.href = `/workspace?lesson=${e.target.value}`; }}>
        <LessonOptions selected={lessonId} />
      </select>
      {lesson.transcript_status === "sample" && <p className="mt-3 rounded-lg bg-warn p-3 text-sm text-warn-foreground">Sample transcript — not verified captions. Learning feedback uses this sample until an admin provides the actual transcript.</p>}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <section className="card-soft overflow-hidden">
            <div className="aspect-video bg-nav">{lesson.youtube_id ? <div ref={host} className="h-full w-full [&_iframe]:h-full [&_iframe]:w-full" /> : <div className="flex h-full items-center justify-center px-5 text-center text-primary-foreground">Transcript-only lesson</div>}</div>
            <div className="p-5">
              <p className="eyebrow">{lesson.source}</p>
              <h2 className="mt-1 text-xl font-extrabold">{lesson.title}</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-mint px-3 py-1 text-secondary-foreground">Current moment · {fmt(now)}</span>
                <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">Watched up to {fmt(watched)}</span>
                <span className="rounded-full bg-muted px-3 py-1">{fmt(now)} / {fmt(lesson.duration_sec)}</span>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="card-soft p-5"><p className="eyebrow">Lesson note</p><h3 className="mt-2 font-extrabold">{marker?.title}</h3><p className="mt-2 text-sm text-muted-foreground">{lesson.note}</p></div>
            <div className="card-soft p-5"><p className="eyebrow">Transcript excerpt · {fmt(chunk?.start_sec ?? 0)}</p><p className="mt-2 text-sm">{chunk?.text}</p>{!lesson.youtube_id && chunk && chunk.end_sec > watched && <Button className="mt-3" onClick={async () => { try { const position = await read({ data: { lessonId, start: chunk.start_sec } }); setWatched(position); watchedRef.current=position; setNow(position); await qc.invalidateQueries({ queryKey: ["stats"] }); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save reading progress."); } }}>Mark segment read</Button>}</div>
          </section>

          <section className="card-soft p-5">
            <p className="eyebrow">Topic markers · {fmt(lesson.duration_sec)}</p>
            <div className="mt-3 divide-y">
              {markers.map((m) => (
                <Button variant="ghost" key={m.id} onClick={() => seek(m.start_sec)} className={`grid w-full grid-cols-[3.5rem_minmax(0,1fr)] gap-3 h-auto whitespace-normal py-3 text-left ${marker?.id === m.id ? "text-primary" : ""}`}>
                  <span className="font-mono text-sm text-teal">{fmt(m.start_sec)}</span>
                  <span><b>{m.title}</b><span className="block text-sm text-muted-foreground">{m.summary}</span></span>
                </Button>
              ))}
            </div>
          </section>

          <Quiz lessonId={lessonId} questions={data.questions} onDone={() => qc.invalidateQueries({ queryKey: ["stats"] })} />
        </div>

        <Tutor key={lessonId} lessonId={lessonId} watched={watched} onSeek={seek} />
      </div>
    </AppShell>
  );
}

type Q = Awaited<ReturnType<typeof loadLesson>>["questions"][number];
function Quiz({ questions, onDone, lessonId }: { questions: Q[]; onDone: () => void; lessonId: string }) {
  const submit = useServerFn(submitQuiz), generate = useServerFn(generatePractice);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; answer_index: number; explanation: string } | null>(null);
  const request = useRef(crypto.randomUUID());
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const q = questions[i];
  if (!q) return null;
  const opts = q.options as string[];
  async function check() {
    if (pick == null || !q || busy) return;
    setBusy(true);
    try { const result = await submit({ data: { questionId: q.id, pick, requestId: request.current } }); setFeedback(result); setChecked(true); onDone(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not save your answer."); }
    finally { setBusy(false); }
  }
  return (
    <section className="card-soft p-5">
      <Button variant="outline" className="mb-4" disabled={busy} onClick={async () => { setBusy(true); try { await generate({ data: { lessonId } }); await qc.invalidateQueries({ queryKey: ["lesson", lessonId] }); toast.success("New practice questions ready."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not generate practice."); } finally { setBusy(false); } }}>New practice</Button>
      <p className="eyebrow">Quick practice · {i + 1} / {questions.length}</p>
      <h3 className="mt-2 text-lg font-extrabold">{q.question}</h3>
      <div className="mt-4 space-y-2">
        {opts.map((o, k) => {
          const state = checked ? (k === feedback?.answer_index ? "border-teal bg-mint" : k === pick ? "border-destructive" : "") : pick === k ? "border-primary bg-mint" : "";
          return <Button variant="ghost" key={k} disabled={checked} onClick={() => setPick(k)} className={`h-auto w-full whitespace-normal justify-start rounded-xl border p-3 text-left text-sm ${state}`}>{o}</Button>;
        })}
      </div>
      {checked && <p className="mt-3 text-sm text-muted-foreground">{pick === feedback?.answer_index ? "Correct. " : "Not quite — added to your revision queue. "}{feedback?.explanation} (see {fmt(q.source_start_sec)})</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">Practice one idea at a time</span>
        {checked ? (
          <Button variant="ghost" onClick={() => { setI((i + 1) % questions.length); setPick(null); setChecked(false); setFeedback(null); request.current = crypto.randomUUID(); }} className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground">Next</Button>
        ) : (
          <Button variant="ghost" onClick={check} disabled={pick == null || busy} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">Check answer <Check className="h-4 w-4" /></Button>
        )}
      </div>
    </section>
  );
}

type Msg = { role: "user"; text: string } | { role: "assistant"; reply: TutorReply; question: string; later?: { start_sec: number; title: string } | null | "loading" | undefined };

function Tutor({ watched, onSeek, lessonId }: { lessonId: string; watched: number; onSeek: (s: number) => void }) {
  const ask = useServerFn(askTutor);
  const later = useServerFn(whereLater);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  useEffect(() => {
    let active = true;
    supabase.from("chat_messages").select("*").eq("lesson_id", lessonId).order("created_at").then(({ data: rows, error }) => {
      if (!active) return;
      if (error) { toast.error("Could not load saved chat."); return; }
      let previous = "";
      const saved: Msg[] = (rows ?? []).map(row => {
        if (row.role === "user") { previous = row.content; return { role: "user", text: row.content }; }
        return { role: "assistant", question: previous, reply: { answer: row.content, grounded: row.grounded, citations: row.citations as unknown as TutorReply["citations"], retrieved_chunks: row.retrieved as unknown as TutorReply["retrieved_chunks"], watched_up_to_sec: row.watched_up_to_sec } };
      });
      setMsgs(saved);
    });
    return () => { active = false; };
  }, [lessonId]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (q.length < 2 || busy) return;
    setText("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const reply = await ask({ data: { lessonId, question: q, watchedUpToSec: watched } });
      setMsgs((m) => [...m, { role: "assistant", reply, question: q }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tutor failed");
    } finally {
      setBusy(false);
    }
  }

  async function findLater(idx: number, question: string) {
    setMsgs((m) => m.map((x, k) => (k === idx && x.role === "assistant" ? { ...x, later: "loading" } : x)));
    try { const r = await later({ data: { lessonId, question, watchedUpToSec: watched } });
      setMsgs((m) => m.map((x, k) => (k === idx && x.role === "assistant" ? { ...x, later: r } : x)));
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not find the topic."); setMsgs(m => m.map((x, k) => k === idx && x.role === "assistant" ? { ...x, later: undefined } : x)); }
  }

  return (
    <aside className="card-soft flex h-fit flex-col p-5 lg:sticky lg:top-24">
      <p className="eyebrow">Ask in context</p>
      <h2 className="mt-1 text-xl font-extrabold">Lesson tutor</h2>
      <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1 text-xs font-semibold text-secondary-foreground"><Lock className="h-3 w-3" /> Answers limited to what you've watched · {fmt(watched)}</p>

      <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto">
        {msgs.length === 0 && <p className="text-sm text-muted-foreground">Ask about anything up to {fmt(watched)}. Try “What makes an operator linear?” after 3:30.</p>}
        {msgs.map((m, idx) =>
          m.role === "user" ? (
            <div key={idx} className="ml-8 rounded-2xl bg-primary p-3 text-sm text-primary-foreground">{m.text}</div>
          ) : m.reply.grounded ? (
            <div key={idx} className="text-sm">
              <p className="leading-relaxed">{m.reply.answer}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {m.reply.citations.map((c, k) => (
                  <Button variant="ghost" key={k} onClick={() => onSeek(c.start_sec)} className="rounded-full border border-teal px-2.5 py-0.5 font-mono text-xs text-teal" title={c.snippet}>▶ {fmt(c.start_sec)}</Button>
                ))}
              </div>
              <details className="mt-2 rounded-xl bg-muted p-3">
                <summary className="flex cursor-pointer items-center gap-1 text-xs font-bold">Why this answer? <ChevronDown className="h-3 w-3" /></summary>
                <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                  {m.reply.retrieved_chunks.map((c) => <li key={c.id}><span className="font-mono text-teal">[{fmt(c.start_sec)}]</span> {c.text}</li>)}
                </ul>
              </details>
            </div>
          ) : (
            <div key={idx} className="rounded-2xl border border-warn-foreground/30 bg-warn p-4 text-sm text-warn-foreground">
              <p className="flex items-center gap-2 font-bold"><ShieldAlert className="h-4 w-4" /> Not in what you've watched</p>
              <p className="mt-1">{m.reply.answer}</p>
              {m.later === undefined && <Button variant="ghost" onClick={() => findLater(idx, m.question)} className="mt-2 font-bold underline">Where is this covered later?</Button>}
              {m.later === "loading" && <p className="mt-2">Looking…</p>}
              {m.later === null && <p className="mt-2">This doesn't seem to be covered in this lesson.</p>}
              {m.later && m.later !== "loading" && <p className="mt-2">Covered at <b>{fmt(m.later.start_sec)}</b> in “{m.later.title}”. Keep watching to unlock it.</p>}
            </div>
          ),
        )}
        {busy && <div className="flex gap-1 p-2"><span className="h-2 w-2 animate-bounce rounded-full bg-teal" /><span className="h-2 w-2 animate-bounce rounded-full bg-teal [animation-delay:150ms]" /><span className="h-2 w-2 animate-bounce rounded-full bg-teal [animation-delay:300ms]" /></div>}
      </div>

      <form onSubmit={send} className="mt-4 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Ask about this moment…" className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm" />
        <Button variant="ghost" disabled={busy} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50" aria-label="Send"><Send className="h-4 w-4" /></Button>
      </form>
    </aside>
  );
}

function LessonOptions({ selected }: { selected: string }) {
  const { data } = useQuery({ queryKey: ["lessons"], queryFn: async () => { const { data, error } = await supabase.from("lessons").select("id,title").order("created_at", { ascending: false }); if (error) throw new Error(error.message); return data; } });
  return <>{data?.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}{!data?.length && <option value={selected}>Loading lesson…</option>}</>;
}
