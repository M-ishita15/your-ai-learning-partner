import { z } from 'zod';

export type TranscriptChunk = { start_sec: number; end_sec: number; text: string };
const seconds = (value: string) => value.replace(',', '.').split(':').reduce((n, part) => n * 60 + Number(part), 0);

export function parseTranscript(raw: string): TranscriptChunk[] {
  const text = raw.replace(/\r/g, '').trim();
  if (!text || text.length > 120000) throw new Error('Paste a transcript of up to 120,000 characters.');
  const cues: TranscriptChunk[] = [];
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.split('\n');
    const index = lines.findIndex(line => line.includes('-->'));
    if (index < 0) continue;
    const match = lines[index]?.match(/([\d:.,]+)\s*-->\s*([\d:.,]+)/);
    if (!match?.[1] || !match[2]) continue;
    const start_sec = Math.floor(seconds(match[1]));
    const end_sec = Math.ceil(seconds(match[2]));
    const content = lines.slice(index + 1).join(' ').replace(/<[^>]*>/g, '').trim();
    if (content && Number.isFinite(start_sec) && end_sec > start_sec) cues.push({ start_sec, end_sec, text: content });
  }
  if (!cues.length) {
    const rows = text.split('\n').map(line => line.match(/^\s*\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s+(.+)$/)).filter((row): row is RegExpMatchArray => !!row);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row?.[1] || !row[2]) continue;
      const start_sec = seconds(row[1]);
      const next = rows[i + 1]?.[1];
      cues.push({ start_sec, end_sec: next ? seconds(next) : start_sec + 25, text: row[2] });
    }
  }
  if (!cues.length) throw new Error('Add timestamps (for example, 0:00 Your words), or upload an SRT/VTT transcript.');
  cues.sort((a, b) => a.start_sec - b.start_sec);
  const chunks: TranscriptChunk[] = [];
  for (const cue of cues) {
    if (cue.start_sec < 0 || cue.end_sec <= cue.start_sec || cue.end_sec > 36000) throw new Error('Transcript timestamps must increase and stay within 10 hours.');
    const previous = chunks.at(-1);
    if (previous && cue.end_sec - previous.start_sec <= 30) {
      previous.end_sec = Math.max(previous.end_sec, cue.end_sec);
      previous.text += ` ${cue.text}`;
    } else chunks.push({ ...cue });
  }
  return chunks;
}

export function youtubeId(raw: string) {
  if (!raw.trim()) return null;
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error('Enter a valid YouTube link.'); }
  const host = url.hostname.replace(/^www\./, '');
  const id = host === 'youtu.be' ? url.pathname.slice(1) : ['youtube.com', 'm.youtube.com'].includes(host) ? url.searchParams.get('v') ?? url.pathname.match(/\/(?:embed|shorts)\/([^/]+)/)?.[1] : undefined;
  if (!id || !/^[\w-]{11}$/.test(id)) throw new Error('Enter a valid YouTube video link.');
  return id;
}

export const GeneratedLesson = z.object({
  summary: z.string(),
  markers: z.array(z.object({ start_sec: z.number(), title: z.string(), summary: z.string() })),
  questions: z.array(z.object({ question: z.string(), options: z.array(z.string()), answer_index: z.number(), explanation: z.string(), source_start_sec: z.number() })),
});

export const ScorecardSchema = z.object({
  scores: z.array(z.object({ label: z.string(), value: z.number(), evidence: z.string(), tip: z.string() })),
  weakest_topic_id: z.string(), revisit_sec: z.number(), summary: z.string(),
});
export type Scorecard = z.infer<typeof ScorecardSchema>;
export const SCORE_LABELS = ['Technical knowledge', 'Communication', 'Problem solving', 'Answer structure'] as const;
export function validateScorecard(card: Scorecard, answers: string[], markers: { id: string; start_sec: number }[]): Scorecard {
  const topic = markers.find(m => m.id === card.weakest_topic_id);
  if (!topic) throw new Error('The scorecard did not reference a lesson topic. Please try again.');
  const scores = SCORE_LABELS.map(label => {
    const score = card.scores.find(s => s.label === label);
    if (!score || !Number.isInteger(score.value) || score.value < 1 || score.value > 5 || !score.evidence.trim() || !answers.some(a => a.includes(score.evidence))) throw new Error('The scorecard could not verify its evidence. Please try again.');
    return score;
  });
  return { ...card, scores, revisit_sec: topic.start_sec };
}
export function nextInterval(current: number, ease = 2.5, correct = true) {
  if (!correct) return 0;
  return current === 0 ? 1 : current === 1 ? 6 : Math.max(current + 1, Math.round(current * ease));
}