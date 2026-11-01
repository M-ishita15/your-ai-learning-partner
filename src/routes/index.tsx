import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Flame, Headphones, ListChecks, Target } from "lucide-react";
import { AppShell, Atom } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { loadLesson, loadStats } from "@/lib/learning";
import { LessonImport } from "@/components/LessonImport";
import { fmt } from "@/lib/time";
import { useEffect } from "react";
import { mascotRevisionDue } from "@/components/Mascot";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Coherence — Your AI path to instant clarity" },
      { name: "description", content: "A timestamp-aware AI tutor that answers only from what you've watched, then runs a mock interview." },
      { property: "og:title", content: "Coherence — Your AI path to instant clarity" },
      { property: "og:description", content: "Learn, ask better questions, practice, and feel ready to explain it." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = useAuth();
  const lessonQ = useQuery({ queryKey: ["lesson"], queryFn: () => loadLesson() });
  const statsQ = useQuery({ queryKey: ["stats", user?.id], queryFn: () => loadStats(), enabled: !!user });
  const lesson = lessonQ.data?.lesson;
  const markers = lessonQ.data?.markers ?? [];
  const s = statsQ.data;
  const pct = lesson && s ? Math.min(100, Math.round((s.maxWatched / lesson.duration_sec) * 100)) : 0;
  const next = s?.due[0] as { topic_markers: { title: string; start_sec: number } | null } | undefined;
  const mastered = s?.mastered ?? 0;
  const dueCount = s?.due.length ?? 0;
  useEffect(() => { if (dueCount > 0) setTimeout(() => mascotRevisionDue(dueCount), 10000); }, [dueCount]);

  return (
    <AppShell crumb="Overview" wide>
      <div className="mb-5 hidden items-end justify-between gap-4 lg:flex">
        <div><p className="eyebrow">Your learning dashboard</p><h2 className="mt-1 text-2xl font-extrabold">A little progress, every day.</h2></div>
        <Button asChild variant="outline"><Link to="/history">Learning history <ArrowRight /></Link></Button>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_1fr]">
        <section className="hero-panel relative overflow-hidden p-7 sm:p-10 lg:p-7">
          <p className="eyebrow">A clearer way through complex ideas</p>
          <h1 className="mt-3 max-w-md text-4xl font-extrabold leading-[1.02] sm:text-5xl lg:text-4xl">Your AI path to instant clarity.</h1>
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <p className="max-w-sm text-lg text-muted-foreground lg:text-sm lg:leading-relaxed">
              One connected place to learn, ask better questions, practice what matters, and feel ready to explain it.
            </p>
            <Atom className="h-24 w-24 shrink-0" />
          </div>
          <div className="mt-7 flex flex-col items-start gap-3 lg:mt-5 lg:flex-row lg:flex-wrap lg:gap-2">
            <Button asChild className="h-auto rounded-2xl px-6 py-4 font-bold lg:rounded-lg lg:px-4 lg:py-3"><Link to={user ? "/workspace" : "/auth"} search={{ t: undefined } as never}>
              Continue learning <ArrowRight className="h-5 w-5" />
            </Link></Button>
            <Button asChild variant="outline" className="h-auto rounded-2xl px-6 py-4 font-bold lg:rounded-lg lg:px-4 lg:py-3"><Link to="/interview" search={{ lesson: undefined, session: undefined }}>
              <Headphones className="h-5 w-5" /> Start mock interview
            </Link></Button>
            <Button asChild variant="secondary" className="h-auto rounded-2xl px-6 py-4 font-bold lg:rounded-lg lg:px-4 lg:py-3"><Link to="/revise">Review concepts</Link></Button>
          </div>
        </section>

        <div className="space-y-4">
        <div className="grid grid-cols-3 items-start gap-3">
          <Stat icon={BookOpen} label="Lesson progress" value={user ? `${pct}%` : "—"} loading={statsQ.isLoading} />
          <Stat icon={Target} label="Practice score" value={s?.score != null ? `${s.score}%` : "—"} loading={statsQ.isLoading} />
          <Stat icon={ListChecks} label="Ready to revisit" value={user ? String(s?.due.length ?? 0) : "—"} loading={statsQ.isLoading} />
        </div>

        {user && (
          <div className="card-soft grid grid-cols-3 gap-2 p-5 text-center lg:py-4">
            <div><Flame className="mx-auto h-5 w-5 text-teal" /><p className="mt-1 text-2xl font-extrabold">{s?.streak ?? 0}</p><p className="text-xs text-muted-foreground">day streak</p></div>
            <div><p className="mt-6 text-2xl font-extrabold">{Math.max(0, mastered)}</p><p className="text-xs text-muted-foreground">topics on track</p></div>
            <div><p className="mt-6 text-2xl font-extrabold">{s?.needsWork ?? 0}</p><p className="text-xs text-muted-foreground">need work</p></div>
          </div>
        )}
        <div className="hidden border-t pt-4 lg:block">
          <div className="mb-2 flex items-center justify-between gap-3"><h3 className="text-sm font-bold">Next in your path</h3><Link to="/revise" className="text-xs font-bold text-secondary-foreground">See revision →</Link></div>
          <p className="text-sm text-muted-foreground">{next?.topic_markers ? `${next.topic_markers.title} · ${fmt(next.topic_markers.start_sec)}` : "Nothing due — your next review will appear here."}</p>
        </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:mt-6 lg:grid-cols-[1.2fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="eyebrow">Pick up where curiosity left off</p>
            <Link to="/workspace" search={{ t: undefined, lesson: undefined }} className="text-sm font-bold text-secondary-foreground">Open workspace →</Link>
          </div>
          <div className="card-soft p-6 lg:p-5">
            <p className="eyebrow">Lesson 01 · Physics</p>
            <h2 className="mt-2 text-2xl font-extrabold">{lesson?.title ?? "Loading…"}</h2>
            <p className="mt-2 text-muted-foreground">{lesson?.summary}</p>
            <p className="mt-3 text-sm text-muted-foreground">⏱ {lesson ? fmt(lesson.duration_sec) : ""} · MIT OpenCourseWare · {markers.length} topic markers</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-teal" style={{ width: `${pct}%` }} /></div>
            <p className="mt-2 flex justify-between text-sm text-muted-foreground"><span>{pct ? "Keep going." : "Ready when you are."}</span><span>{pct}%</span></p>
            <div className="mt-4 hidden divide-y border-t lg:block">
              {markers.slice(0, 3).map((marker, index) => <Link key={marker.id} to="/workspace" search={{ t: marker.start_sec, lesson: lesson?.id }} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 text-sm transition-colors hover:text-secondary-foreground"><span className="font-mono text-xs text-teal">{String(index + 1).padStart(2, "0")}</span><span className="truncate font-semibold">{marker.title}</span><span className="font-mono text-xs text-muted-foreground">{fmt(marker.start_sec)}</span></Link>)}
            </div>
          </div>
        </section>
        <section className="space-y-6">
          <div className="lg:hidden">
            <div className="mb-3 flex items-center justify-between"><h3 className="font-extrabold">Next in your path</h3><Link to="/revise" className="text-sm font-bold text-secondary-foreground">See revision →</Link></div>
            <div className="card-soft p-5">
              {next?.topic_markers ? (
                <><p className="font-bold">{next.topic_markers.title}</p><p className="text-sm text-muted-foreground">Return to {fmt(next.topic_markers.start_sec)} in the lesson</p></>
              ) : (
                <p className="text-sm text-muted-foreground">Nothing due — answer quiz questions and missed topics will show up here.</p>
              )}
            </div>
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between"><h3 className="font-extrabold">Recently active</h3><Link to="/history" className="text-sm font-bold text-secondary-foreground">History →</Link></div>
            <div className="card-soft p-5 text-sm text-muted-foreground">
              {s?.attempts.length ? `${s.attempts.length} practice answers · last on ${new Date(s.attempts[0]?.created_at ?? Date.now()).toLocaleDateString()}` : "Your practice and interview sessions will appear here as you work."}
            </div>
          </div>
        </section>
      </div>
      <LessonImport />
      {user && s?.interviews[0] && <p className="mt-5 text-sm text-muted-foreground">Last interview · {new Date(s.interviews[0].created_at).toLocaleDateString()} · {s.interviews[0].status}</p>}
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, loading }: { icon: typeof BookOpen; label: string; value: string; loading?: boolean }) {
  return (
    <div className="card-soft flex flex-col gap-2 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-mint"><Icon className="h-5 w-5 text-teal" /></span>
      <p className="text-xs text-muted-foreground">{label}</p>
      {loading ? <div className="h-7 w-12 animate-pulse rounded bg-muted" /> : <p className="text-2xl font-extrabold">{value}</p>}
    </div>
  );
}
