import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { loadLesson, loadStats } from "@/lib/learning";
import { fmt } from "@/lib/time";

export const Route = createFileRoute("/_authenticated/revise")({
  head: () => ({ meta: [{ title: "Revision desk · Coherence" }, { name: "description", content: "Missed topics and study tools anchored to lesson timestamps." }, { property: "og:title", content: "Revision desk · Coherence" }, { property: "og:description", content: "Missed topics and study tools anchored to lesson timestamps." }] }),
  component: Revise,
});

function Revise() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: () => loadStats() });
  const lesson = useQuery({ queryKey: ["lesson"], queryFn: () => loadLesson() });
  const [card, setCard] = useState<number | null>(null);
  const due = (stats.data?.due ?? []) as { id: string; topic_markers: { title: string; start_sec: number } | null }[];
  const qs = lesson.data?.questions ?? [];
  const q = card != null ? qs[card] : null;

  return (
    <AppShell crumb="Revision desk" wide>
      <p className="eyebrow">Return to the ideas that need another pass</p>
      <h1 className="mt-2 text-4xl font-extrabold">Revision desk</h1>
      <p className="mt-2 text-muted-foreground">Missed quiz topics and study tools, all anchored to lesson timestamps.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card-soft p-5">
          <div className="flex justify-between"><h2 className="font-extrabold">Needs another look</h2><span className="text-sm text-muted-foreground">{due.length} in your queue</span></div>
          <div className="mt-3 divide-y">
            {stats.isLoading && <div className="h-12 animate-pulse rounded bg-muted" />}
            {!stats.isLoading && due.length === 0 && <p className="py-3 text-sm text-muted-foreground">Nothing due. Wrong quiz answers land here automatically.</p>}
            {due.map((d) => (
              <div key={d.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div><b>{d.topic_markers?.title}</b><p className="text-sm text-muted-foreground">MIT OpenCourseWare · 8.04 · {fmt(d.topic_markers?.start_sec ?? 0)}</p></div>
                <Link to="/workspace" search={{ t: d.topic_markers?.start_sec ?? 0 }} className="font-bold text-secondary-foreground">Revisit →</Link>
              </div>
            ))}
          </div>
        </section>
        <section className="card-soft p-5">
          <h2 className="font-extrabold">Flashcard moment</h2>
          <p className="mt-1 text-sm text-muted-foreground">A quick recall cue, then a direct jump to the matching lesson moment.</p>
          {q ? (
            <details className="mt-4 rounded-2xl bg-mint p-4">
              <summary className="cursor-pointer font-bold">{q.question}</summary>
              <p className="mt-2 text-sm">{(q.options as string[])[q.answer_index]}</p>
              <Link to="/workspace" search={{ t: q.source_start_sec }} className="mt-2 inline-block text-sm font-bold text-secondary-foreground">Watch at {fmt(q.source_start_sec)} →</Link>
            </details>
          ) : null}
          <button onClick={() => setCard(Math.floor(Math.random() * Math.max(1, qs.length)))} className="mt-4 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground">Draw a card →</button>
        </section>
      </div>
    </AppShell>
  );
}
