import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import type { Scorecard as Card } from '@/lib/lesson-content';
import { fmt } from '@/lib/time';
export function Scorecard({ card, lessonId, readOnly = false }: { card: Card; lessonId?: string; readOnly?: boolean }) {
  return <section className="mt-6 space-y-5">
    <div><p className="eyebrow">Your scorecard</p><h2 className="mt-2 text-2xl font-extrabold">A clearer next step.</h2><p className="mt-2 text-muted-foreground">{card.summary}</p></div>
    <div className="grid gap-4 sm:grid-cols-2">{card.scores.map(s => <article key={s.label} className="card-soft p-5">
      <div className="flex items-center justify-between gap-3"><h3 className="font-bold">{s.label}</h3><b className="text-xl text-teal">{s.value}/5</b></div>
      <blockquote className="mt-4 border-l-2 border-teal pl-3 text-sm">“{s.evidence}”</blockquote><p className="mt-3 text-sm text-muted-foreground">{s.tip}</p>
    </article>)}</div>
    {!readOnly && <Button asChild variant="secondary"><Link to="/workspace" search={{ t: card.revisit_sec, lesson: lessonId }}>Revisit this at {fmt(card.revisit_sec)} →</Link></Button>}
  </section>;
}
