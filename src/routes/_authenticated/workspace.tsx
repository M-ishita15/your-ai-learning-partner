import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/workspace")({
  head: () => ({ meta: [{ title: "Learning workspace · Coherence" }, { name: "description", content: "Watch the lecture, practice, and ask the spoiler-proof tutor." }, { property: "og:title", content: "Learning workspace · Coherence" }, { property: "og:description", content: "Watch the lecture, practice, and ask the spoiler-proof tutor." }] }),
  component: () => (
    <AppShell crumb="Learning workspace">
      <p className="eyebrow">Coherence</p>
      <h1 className="mt-2 text-4xl font-extrabold">Learning workspace</h1>
      <p className="mt-3 text-muted-foreground">Watch the lecture, practice, and ask the spoiler-proof tutor.</p>
      <div className="card-soft mt-6 p-6 text-sm text-muted-foreground">This page is being built next.</div>
    </AppShell>
  ),
});
