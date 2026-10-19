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
import { askTutor, whereLater, type TutorReply } from "@/lib/tutor.functions";

export const Route = createFileRoute("/_authenticated/workspace")({
  validateSearch: (s: Record<string, unknown>) => ({ t: typeof s["t"] === "number" ? (s["t"] as number) : undefined }),
  head: () => ({
    meta: [
      { title: "Learning workspace · Coherence" },
      { name: "description", content: "Watch the lecture, practice, and ask the spoiler-proof tutor." },
      { property: "og:title", content: "Learning workspace · Coherence" },
      { property: "og:description", content: "Watch the lecture, practice, and ask the spoiler-proof tutor." },
    ],
  }),
  component: Workspace,
});

type YTPlayer = { getCurrentTime(): number; seekTo(s: number, a: boolean): void; playVideo(): void };
declare global {
  interface Window { YT?: { Player: new (el: HTMLElement, o: object) => YTPlayer }; onYouTubeIframeAPIReady?: () => void }
}

function Workspace() {
  const { t } = Route.useSearch();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["lesson"], queryFn: () => loadLesson() });
  const stats = useQuery({ queryKey: ["stats"], queryFn: () => loadStats() });
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [now, setNow] = useState(0);
  const [watched, setWatched] = useState(0);
  const watchedRef = useRef(0);

  useEffect(() => {
    if (stats.data && stats.data.maxWatched > watchedRef.current) {
      watchedRef.current = stats.data.maxWatched;
      setWatched(stats.data.maxWatched);
    }
  }, [stats.data]);

  // YouTube player
  useEffect(() => {
    if (!data?.lesson.youtube_id || !host.current) return;
    const make = () => {
      player.current = new window.YT!.Player(host.current!, {
        videoId: data.lesson.youtube_id,
        playerVars: { rel: 0, modestbranding: 1, start: t ?? 0 },
      });
    };
    if (window.YT?.Player) make();
    else {
      window.onYouTubeIframeAPIReady = make;
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(s);
    }
  }, [data?.lesson.youtube_id]);

  // Poll position + save progress
  useEffect(() => {
    let lastSaved = 0;
    const id = setInterval(async () => {
      const cur = Math.floor(player.current?.getCurrentTime?.() ?? 0);
      setNow(cur);
      if (cur > watchedRef.current) {
        watchedRef.current = cur;
        setWatched(cur);
        if (cur - lastSaved >= 10) {
          lastSaved = cur;
          const { data: u } = await supabase.auth.getUser();
          if (u.user) await supabase.from("user_progress").upsert({ user_id: u.user.id, lesson_id: SEED_LESSON_ID, max_watched_sec: cur, updated_at: new Date().toISOString() });
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const seek = (s: number) => { player.current?.seekTo(s, true); player.current?.playVideo(); setNow(s); };

  if (!data) return <AppShell crumb="Learning workspace" wide><div className="h-64 animate-pulse rounded-3xl bg-muted" /></AppShell>;
  const { lesson, markers, chunks } = data;
  const marker = [...markers].reverse().find((m) => m.start_sec <= now) ?? markers[0];
  const chunk = [...chunks].reverse().find((c) => c.start_sec <= now) ?? chunks[0];

  return (
    <AppShell crumb="Learning workspace" wide>
      <p className="eyebrow">A continuous learning workspace</p>
      <h1 className="mt-2 text-4xl font-extrabold">Stay with the idea.</h1>
      <p className="mt-2 text-muted-foreground">Move from the lecture to a clearer explanation, practice, and an interview-ready answer.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="card-soft overflow-hidden">
            <div className="aspect-video bg-nav"><div ref={host} className="h-full w-full" /></div>
            <div className="p-5">
              <p className="eyebrow">Quantum mechanics · MIT OpenCourseWare</p>
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
            <div className="card-soft p-5"><p className="eyebrow">Transcript excerpt · {fmt(chunk?.start_sec ?? 0)}</p><p className="mt-2 text-sm">{chunk?.text}</p></div>
          </section>

          <section className="card-soft p-5">
            <p className="eyebrow">Topic markers · {fmt(lesson.duration_sec)}</p>
            <div className="mt-3 divide-y">
              {markers.map((m) => (
                <button key={m.id} onClick={() => seek(m.start_sec)} className={`grid w-full grid-cols-[3.5rem_minmax(0,1fr)] gap-3 py-3 text-left ${marker?.id === m.id ? "text-primary" : ""}`}>
                  <span className="font-mono text-sm text-teal">{fmt(m.start_sec)}</span>
                  <span><b>{m.title}</b><span className="block text-sm text-muted-foreground">{m.summary}</span></span>
                </button>
              ))}
            </div>
          </section>

          <Quiz questions={data.questions} onDone={() => qc.invalidateQueries({ queryKey: ["stats"] })} />
        </div>

        <Tutor watched={watched} onSeek={seek} />
      </div>
    </AppShell>
  );
}

type Q = Awaited<ReturnType<typeof loadLesson>>["questions"][number];
function Quiz({ questions, onDone }: { questions: Q[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const q = questions[i];
  if (!q) return null;
  const opts = q.options as string[];
  async function check() {
    if (pick == null) return;
    setChecked(true);
    const { error } = await supabase.from("quiz_attempts").insert({ question_id: q!.id, correct: pick === q!.answer_index });
    if (error) toast.error("Couldn't save your answer");
    else onDone();
  }
  return (
    <section className="card-soft p-5">
      <p className="eyebrow">Quick practice · {i + 1} / {questions.length}</p>
      <h3 className="mt-2 text-lg font-extrabold">{q.question}</h3>
      <div className="mt-4 space-y-2">
        {opts.map((o, k) => {
          const state = checked ? (k === q.answer_index ? "border-teal bg-mint" : k === pick ? "border-destructive" : "") : pick === k ? "border-primary bg-mint" : "";
          return <button key={k} disabled={checked} onClick={() => setPick(k)} className={`w-full rounded-xl border p-3 text-left text-sm ${state}`}>{o}</button>;
        })}
      </div>
      {checked && <p className="mt-3 text-sm text-muted-foreground">{pick === q.answer_index ? "Correct. " : "Not quite — added to your revision queue. "}{q.explanation} (see {fmt(q.source_start_sec)})</p>}
      <div className="mt-4 flex justify-between">
        <span className="text-sm text-muted-foreground">Practice one idea at a time</span>
        {checked ? (
          <button onClick={() => { setI((i + 1) % questions.length); setPick(null); setChecked(false); }} className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground">Next</button>
        ) : (
          <button onClick={check} disabled={pick == null} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">Check answer <Check className="h-4 w-4" /></button>
        )}
      </div>
    </section>
  );
}

type Msg = { role: "user"; text: string } | { role: "assistant"; reply: TutorReply; question: string; later?: { start_sec: number; title: string } | null | "loading" };

function Tutor({ watched, onSeek }: { watched: number; onSeek: (s: number) => void }) {
  const ask = useServerFn(askTutor);
  const later = useServerFn(whereLater);
  const [msgs, setMsgs] = useState<Msg[]>([]);
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
      const reply = await ask({ data: { lessonId: SEED_LESSON_ID, question: q, watchedUpToSec: watched } });
      setMsgs((m) => [...m, { role: "assistant", reply, question: q }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tutor failed");
    } finally {
      setBusy(false);
    }
  }

  async function findLater(idx: number, question: string) {
    setMsgs((m) => m.map((x, k) => (k === idx && x.role === "assistant" ? { ...x, later: "loading" } : x)));
    const r = await later({ data: { lessonId: SEED_LESSON_ID, question, watchedUpToSec: watched } });
    setMsgs((m) => m.map((x, k) => (k === idx && x.role === "assistant" ? { ...x, later: r } : x)));
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
                  <button key={k} onClick={() => onSeek(c.start_sec)} className="rounded-full border border-teal px-2.5 py-0.5 font-mono text-xs text-teal" title={c.snippet}>▶ {fmt(c.start_sec)}</button>
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
              {m.later === undefined && <button onClick={() => findLater(idx, m.question)} className="mt-2 font-bold underline">Where is this covered later?</button>}
              {m.later === "loading" && <p className="mt-2">Looking…</p>}
              {m.later === null && <p className="mt-2">This doesn't seem to be covered in this lesson.</p>}
              {m.later && m.later !== "loading" && <p className="mt-2">Covered at <b>{fmt(m.later.start_sec)}</b> in “{m.later.title}”. Keep watching to unlock it.</p>}
            </div>
          ),
        )}
        {busy && <div className="flex gap-1 p-2"><span className="h-2 w-2 animate-bounce rounded-full bg-teal" /><span className="h-2 w-2 animate-bounce rounded-full bg-teal [animation-delay:150ms]" /><span className="h-2 w-2 animate-bounce rounded-full bg-teal [animation-delay:300ms]" /></div>}
      </div>

      <form onSubmit={send} className="mt-4 flex gap-2">
        <input autoFocus value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Ask about this moment…" className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm" />
        <button disabled={busy} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50" aria-label="Send"><Send className="h-4 w-4" /></button>
      </form>
    </aside>
  );
}
