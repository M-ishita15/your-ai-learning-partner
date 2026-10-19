import { Link, useNavigate } from "@tanstack/react-router";
import { Activity, BookOpen, ChevronRight, Clock, Headphones, LogOut, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { initials, useAuth } from "@/hooks/useAuth";

const NAV = [
  { to: "/", label: "Home", icon: Activity },
  { to: "/workspace", label: "Workspace", icon: BookOpen },
  { to: "/interview", label: "Interview", icon: Headphones },
  { to: "/revise", label: "Revise", icon: RefreshCw },
  { to: "/history", label: "History", icon: Clock },
] as const;

export function AppShell({ crumb, children, wide }: { crumb: string; children: ReactNode; wide?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen lg:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-nav p-4 lg:flex">
        <div className="mb-8 flex items-center gap-2 px-3 pt-2">
          <span className="h-3 w-3 rounded-full bg-teal" />
          <span className="font-display text-lg font-bold text-primary-foreground">Coherence</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-nav-foreground transition hover:bg-nav-active"
              activeProps={{ className: "bg-nav-active text-primary-foreground" }}
            >
              <Icon className="h-5 w-5 text-teal" /> {label}
            </Link>
          ))}
        </nav>
      </aside>

      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="text-muted-foreground">Coherence</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate font-semibold">{crumb}</span>
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth" });
                }}
                className="hidden rounded-full p-2 text-muted-foreground hover:bg-muted sm:block"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                {initials(user)}
              </span>
            </div>
          ) : (
            <Link to="/auth" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className={`mx-auto px-5 pb-32 pt-6 lg:pb-12 ${wide ? "max-w-6xl" : "max-w-4xl"}`}>{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 bg-nav px-2 pb-3 pt-2 lg:hidden">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-semibold text-nav-foreground"
            activeProps={{ className: "bg-nav-active text-primary-foreground" }}
          >
            <Icon className="h-5 w-5 text-teal" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Atom({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden>
      <g stroke="var(--color-mint-strong)" strokeWidth="1.5">
        <ellipse cx="50" cy="50" rx="45" ry="20" transform="rotate(45 50 50)" />
        <ellipse cx="50" cy="50" rx="45" ry="20" transform="rotate(-45 50 50)" />
        <ellipse cx="50" cy="50" rx="20" ry="45" />
      </g>
      <circle cx="50" cy="50" r="9" fill="var(--color-mint)" />
      <circle cx="50" cy="50" r="4.5" fill="var(--color-teal)" />
    </svg>
  );
}
