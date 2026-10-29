import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Atom } from "@/components/AppShell";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Coherence" },
      { name: "description", content: "Sign in to Coherence, your timestamp-aware AI learning assistant." },
      { property: "og:title", content: "Sign in · Coherence" },
      { property: "og:description", content: "Sign in to Coherence, your timestamp-aware AI learning assistant." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const err = hash.get("error_description") ?? new URLSearchParams(window.location.search).get("error_description");
    if (err) toast.error(err);
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/" }); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s?.user) navigate({ to: "/" }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (mode === "up" && !data.session) { toast.success("Check your email to confirm your account."); return; }
    navigate({ to: "/" });
  }

  async function oauth(p: "google" | "lovable") {
    setBusy(true);
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin, ...(p === "google" ? { extraParams: { prompt: "select_account" } } : {}) }).catch((e: unknown) => ({ error: e instanceof Error ? e : new Error(String(e)), redirected: false }));
    setBusy(false);
    if (r.error) { toast.error(r.error.message || "Sign-in did not complete. Please try again."); return; }
    if (r.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="grid min-h-screen place-items-center px-5 py-10">
      <div className="hero-panel w-full max-w-md p-8">
        <Atom className="mb-4 h-16 w-16" />
        <p className="eyebrow">A clearer way through complex ideas</p>
        <h1 className="mt-2 text-3xl font-extrabold">{mode === "in" ? "Welcome back." : "Create your account."}</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input className="w-full rounded-xl border bg-card px-4 py-3" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded-xl border bg-card px-4 py-3" type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={busy} className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-60">
            {mode === "in" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <div className="mt-3 grid gap-2">
          <button disabled={busy} onClick={() => oauth("google")} className="w-full rounded-xl border bg-card py-3 font-semibold">Continue with Google</button>
          <button disabled={busy} onClick={() => oauth("lovable")} className="w-full rounded-xl border bg-card py-3 font-semibold">Continue with Lovable</button>
        </div>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 text-sm font-semibold text-secondary-foreground">
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
