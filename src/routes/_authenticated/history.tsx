import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ScorecardSchema } from "@/lib/lesson-content";
import { loadStats } from "@/lib/learning";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Learning history · Coherence" }, { name: "description", content: "Your quiz attempts and score trend over time." }, { property: "og:title", content: "Learning history · Coherence" }, { property: "og:description", content: "Your quiz attempts and score trend over time." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: History,
});

function History() {
  const { data, isLoading } = useQuery({ queryKey: ["stats"], queryFn: () => loadStats() });
  const attempts = data?.attempts ?? [];
  const byDay = new Map<string, { c: number; n: number }>();
  for (const a of attempts) {
    const d = a.created_at.slice(0, 10);
    const v = byDay.get(d) ?? { c: 0, n: 0 };
    v.n++; if (a.correct) v.c++;
    byDay.set(d, v);
  }
  const trend = [...byDay.entries()].sort().slice(-14);

  return (
    <AppShell crumb="Learning history" wide>
      <p className="eyebrow">Your work stays yours</p>
      <h1 className="mt-2 text-4xl font-extrabold">Learning history</h1>
      <p className="mt-2 text-muted-foreground">A private record of your practice rounds, saved to your account.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card-soft p-5">
          <p className="eyebrow">Practice that adds up</p>
          <h2 className="mt-1 text-xl font-extrabold">Quiz attempts</h2>
          {isLoading ? <div className="mt-4 h-24 animate-pulse rounded bg-muted" /> : attempts.length === 0 ? (
            <div className="mt-4"><p className="font-bold">Your first practice round is one step away.</p><Link to="/workspace" search={{ t: undefined, lesson: undefined }} className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground">Start practice →</Link></div>
          ) : (
            <p className="mt-3 text-3xl font-extrabold">{attempts.length} answers · {data?.score}% correct</p>
          )}
        </section>
        <section className="card-soft p-5">
          <h2 className="font-extrabold">Score trend</h2>
          {trend.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Practice on a few days to see your trend.</p> : (
            <div className="mt-4 flex h-32 items-end gap-2">
              {trend.map(([d, v]) => (
                <div key={d} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-teal" style={{ height: `${Math.max(6, (v.c / v.n) * 100)}%` }} title={`${d}: ${Math.round((v.c / v.n) * 100)}%`} />
                  <span className="text-[10px] text-muted-foreground">{d.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <section className="mt-8 border-t pt-6"><h2 className="text-xl font-bold">Saved interviews</h2>
        {data?.interviews.length ? <div className="mt-4 divide-y">{data.interviews.map(session => {
          const card = ScorecardSchema.safeParse(session.scorecard);
          const average = card.success ? (card.data.scores.reduce((sum, score) => sum + score.value, 0) / 4).toFixed(1) : null;
          return <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><b>{average ? `${average}/5 · Interview complete` : 'Interview in progress'}</b><p className="text-sm text-muted-foreground">{new Date(session.created_at).toLocaleString()}</p></div><Button asChild variant="secondary"><Link to="/interview" search={{ lesson: session.lesson_id, session: session.id }}>{average ? 'View scorecard' : 'Continue'} →</Link></Button></div>;
        })}</div> : <p className="mt-3 text-sm text-muted-foreground">No interviews saved yet.</p>}
      </section>
      <section className="mt-8 border-t pt-6"><h2 className="text-xl font-bold">Recent quiz answers</h2><div className="mt-3 divide-y">{attempts.slice(0, 30).map((a, i) => <div key={`${a.created_at}-${i}`} className="flex justify-between gap-3 py-3 text-sm"><span>{a.correct ? 'Correct' : 'Needs revision'}</span><time className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</time></div>)}</div></section>
    </AppShell>
  );
}
