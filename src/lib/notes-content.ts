import { z } from 'zod';

export const NoteInput = z.object({
  id: z.string().guid().optional(),
  lessonId: z.string().guid(),
  title: z.string().trim().max(120),
  body: z.string().trim().min(1).max(12000),
  position: z.number().int().min(0).max(36000),
});

export const SummaryOutput = z.object({
  title: z.string(),
  points: z.array(z.object({ text: z.string(), start_sec: z.number(), quote: z.string() })),
});

export function validateNoteSummary(output: z.infer<typeof SummaryOutput>, chunks: { start_sec: number; end_sec: number; text: string }[], watched: number) {
  if (!output.points.length || output.points.length > 6 || output.points.some(p => !p.text.trim() || !p.quote.trim() || !chunks.some(c => c.end_sec <= watched && c.start_sec === p.start_sec && c.text.includes(p.quote)))) {
    throw new Error('The summary could not be verified against your watched transcript.');
  }
  return output;
}