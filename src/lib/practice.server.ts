import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { nextInterval } from './lesson-content';

export async function watchedContent(db: SupabaseClient<Database>, lessonId: string) {
  const [progress, lesson, markers, chunks] = await Promise.all([
    db.from('user_progress').select('max_watched_sec').eq('lesson_id', lessonId).maybeSingle(),
    db.from('lessons').select('*').eq('id', lessonId).single(),
    db.from('topic_markers').select('*').eq('lesson_id', lessonId).order('start_sec'),
    db.from('transcript_chunks').select('id,start_sec,end_sec,text').eq('lesson_id', lessonId).order('start_sec'),
  ]);
  for (const result of [progress, lesson, markers, chunks]) if (result.error) throw new Error(result.error.message);
  if (!lesson.data) throw new Error('Lesson not found.');
  const watched = progress.data?.max_watched_sec ?? 0;
  const excerpts = (chunks.data ?? []).filter(c => c.end_sec <= watched);
  const topics = (markers.data ?? []).filter(m => excerpts.some(c => c.start_sec >= m.start_sec));
  return { lesson: lesson.data, watched, markers: topics, chunks: excerpts };
}

export async function reserve(db: SupabaseClient<Database>) {
  const { error } = await db.rpc('reserve_ai_request');
  if (error) throw new Error(error.message);
}

export async function reviseTopic(db: SupabaseClient<Database>, userId: string, topicId: string, correct: boolean) {
  const { data: current, error } = await db.from('revision_items').select('*').eq('topic_marker_id', topicId).maybeSingle();
  if (error) throw new Error(error.message);
  const interval = nextInterval(current?.interval_days ?? 0, Number(current?.ease ?? 2.5), correct);
  const { error: saveError } = await db.from('revision_items').upsert({
    user_id: userId, topic_marker_id: topicId, interval_days: interval,
    ease: correct ? Number(current?.ease ?? 2.5) : Math.max(1.3, Number(current?.ease ?? 2.5) - 0.2),
    due_at: new Date(Date.now() + interval * 86400000).toISOString(), last_result: correct ? 'correct' : 'wrong',
  }, { onConflict: 'user_id,topic_marker_id' });
  if (saveError) throw new Error(saveError.message);
}
