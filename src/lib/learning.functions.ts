import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const savePlayback = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ lessonId: z.string().guid(), position: z.number().int().min(0).max(36000) }).parse(d)).handler(async ({ data, context }) => {
  const { data: position, error } = await context.supabase.rpc('record_playback', { _lesson: data.lessonId, _position: data.position });
  if (error) throw new Error(error.message);
  return position;
});
export const submitQuiz = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ questionId: z.string().guid(), pick: z.number().int().min(0).max(10), requestId: z.string().guid() }).parse(d)).handler(async ({ data, context }) => {
  const { data: feedback, error } = await context.supabase.rpc('submit_quiz', { _question: data.questionId, _pick: data.pick, _request: data.requestId });
  if (error) throw new Error(error.message);
  return feedback as { correct: boolean; answer_index: number; explanation: string };
});