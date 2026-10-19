import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { loadStats } from "@/lib/learning";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Learning history · Coherence" }, { name: "description", content: "Your quiz attempts and score trend over time." }, { property: "og:title", content: "Learning history · Coherence" }, { property: "og:description", content: "Your quiz attempts and score trend over time." }] }),
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
            <div className="mt-4"><p className="font-bold">Your first practice round is one step away.</p><Link to="/workspace" search={{ t: undefined }} className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground">Start practice →</Link></div>
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
    </AppShell>
  );
}
