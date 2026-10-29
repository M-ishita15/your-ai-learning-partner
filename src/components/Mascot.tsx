import { useEffect, useState } from "react";
import { Volume2, VolumeX, X } from "lucide-react";

export type MascotMoment = "onboarding" | "quiz-right" | "quiz-wrong" | "interview" | "revision-due";

const LINES: Record<MascotMoment, string[]> = {
  onboarding: [
    "Hi, I'm Qubit! Small steps every day add up to big understanding.",
    "Hi, I'm Qubit! Curiosity is your superpower. Let's learn something new.",
    "Hi, I'm Qubit! You don't have to be fast, just keep going.",
  ],
  "quiz-right": ["Nailed it! That idea is clicking.", "Correct! Your brain just leveled up."],
  "quiz-wrong": ["Not quite, and that's fine. Mistakes are how learning sticks. I've added it to Revise.", "Close! Let's revisit that moment together soon."],
  interview: ["Great job finishing the interview! Check your scorecard for one thing to improve.", "Interview done! Explaining ideas out loud is the best practice there is."],
  "revision-due": ["A few ideas are ready for review. A quick pass now keeps them fresh!"],
};

const EVENT = "coherence:mascot";
const MUTE_KEY = "coherence:mascot-muted";

/** Trigger the mascot from anywhere. Only call at key learning moments. */
export function mascotSay(moment: MascotMoment) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: moment }));
}

/** Show the revision-due nudge at most once per day. */
export function mascotRevisionDue(count: number) {
  if (typeof window === "undefined" || count <= 0) return;
  const key = `coherence:revision-nudge:${new Date().toDateString()}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, "1");
  mascotSay("revision-due");
}

function speak(text: string) {
  if (localStorage.getItem(MUTE_KEY) === "1" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.05; u.pitch = 1.3;
  window.speechSynthesis.speak(u);
}

export function Mascot() {
  const [text, setText] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(localStorage.getItem(MUTE_KEY) === "1");
    const onSay = (e: Event) => {
      const moment = (e as CustomEvent<MascotMoment>).detail;
      const options = LINES[moment];
      const line = options[Math.floor(Math.random() * options.length)] ?? options[0]!;
      setText(line);
      speak(line);
    };
    window.addEventListener(EVENT, onSay);
    if (!sessionStorage.getItem("coherence:onboarded")) {
      sessionStorage.setItem("coherence:onboarded", "1");
      setTimeout(() => mascotSay("onboarding"), 600);
    }
    return () => window.removeEventListener(EVENT, onSay);
  }, []);

  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => setText(null), 9000);
    return () => clearTimeout(t);
  }, [text]);

  if (!text) return null;
  return (
    <div role="status" aria-live="polite" className="fixed bottom-24 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-end gap-2 animate-in fade-in slide-in-from-bottom-4 lg:bottom-6">
      <div className="relative max-w-xs rounded-2xl rounded-br-sm border bg-card p-4 pr-8 text-sm font-medium shadow-xl">
        <p>{text}</p>
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <button aria-label="Close tutor message" onClick={() => { window.speechSynthesis?.cancel(); setText(null); }} className="rounded p-0.5 text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
          <button aria-label={muted ? "Unmute tutor voice" : "Mute tutor voice"} onClick={() => { const m = !muted; setMuted(m); localStorage.setItem(MUTE_KEY, m ? "1" : "0"); if (m) window.speechSynthesis?.cancel(); }} className="rounded p-0.5 text-muted-foreground hover:bg-muted">{muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}</button>
        </div>
      </div>
      <MascotFace className="h-16 w-16 shrink-0 animate-bounce [animation-duration:2s]" />
    </div>
  );
}

export function MascotFace({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-label="Qubit, your AI tutor">
      <line x1="32" y1="4" x2="32" y2="13" stroke="var(--color-teal)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="5" r="3.5" fill="var(--color-mint-strong)" />
      <rect x="8" y="13" width="48" height="40" rx="16" fill="var(--color-teal)" />
      <rect x="14" y="20" width="36" height="24" rx="11" fill="var(--color-mint)" />
      <circle cx="25" cy="31" r="3.5" fill="var(--color-teal)" />
      <circle cx="39" cy="31" r="3.5" fill="var(--color-teal)" />
      <circle cx="26" cy="30" r="1.1" fill="var(--color-mint)" />
      <circle cx="40" cy="30" r="1.1" fill="var(--color-mint)" />
      <path d="M27 37 q5 4 10 0" stroke="var(--color-teal)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="19" cy="37" r="2.2" fill="var(--color-mint-strong)" opacity=".7" />
      <circle cx="45" cy="37" r="2.2" fill="var(--color-mint-strong)" opacity=".7" />
      <rect x="2" y="27" width="6" height="12" rx="3" fill="var(--color-mint-strong)" />
      <rect x="56" y="27" width="6" height="12" rx="3" fill="var(--color-mint-strong)" />
    </svg>
  );
}
