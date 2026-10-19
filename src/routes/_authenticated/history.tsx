import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Learning history · Coherence" }, { name: "description", content: "Your quiz attempts and saved mock interviews." }, { property: "og:title", content: "Learning history · Coherence" }, { property: "og:description", content: "Your quiz attempts and saved mock interviews." }] }),
  component: () => (
    <AppShell crumb="Learning history">
      <p className="eyebrow">Coherence</p>
      <h1 className="mt-2 text-4xl font-extrabold">Learning history</h1>
      <p className="mt-3 text-muted-foreground">Your quiz attempts and saved mock interviews.</p>
      <div className="card-soft mt-6 p-6 text-sm text-muted-foreground">This page is being built next.</div>
    </AppShell>
  ),
});
