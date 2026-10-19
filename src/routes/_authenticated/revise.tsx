import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/revise")({
  head: () => ({ meta: [{ title: "Revision desk · Coherence" }, { name: "description", content: "Missed topics and study tools anchored to lesson timestamps." }, { property: "og:title", content: "Revision desk · Coherence" }, { property: "og:description", content: "Missed topics and study tools anchored to lesson timestamps." }] }),
  component: () => (
    <AppShell crumb="Revision desk">
      <p className="eyebrow">Coherence</p>
      <h1 className="mt-2 text-4xl font-extrabold">Revision desk</h1>
      <p className="mt-3 text-muted-foreground">Missed topics and study tools anchored to lesson timestamps.</p>
      <div className="card-soft mt-6 p-6 text-sm text-muted-foreground">This page is being built next.</div>
    </AppShell>
  ),
});
