import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({ meta: [{ title: "Mock interview · Coherence" }, { name: "description", content: "Three lesson-based questions and a four-part scorecard." }, { property: "og:title", content: "Mock interview · Coherence" }, { property: "og:description", content: "Three lesson-based questions and a four-part scorecard." }] }),
  component: () => (
    <AppShell crumb="Mock interview">
      <p className="eyebrow">Coherence</p>
      <h1 className="mt-2 text-4xl font-extrabold">Mock interview</h1>
      <p className="mt-3 text-muted-foreground">Three lesson-based questions and a four-part scorecard.</p>
      <div className="card-soft mt-6 p-6 text-sm text-muted-foreground">This page is being built next.</div>
    </AppShell>
  ),
});
