import { supabase } from "@/integrations/supabase/client";
import { SEED_LESSON_ID } from "./time";

export async function loadLesson(lessonId = SEED_LESSON_ID) {
  const [l, m, c, q] = await Promise.all([
    supabase.from("lessons").select("*").eq("id", lessonId).single(),
    supabase.from("topic_markers").select("*").eq("lesson_id", lessonId).eq("active",true).order("start_sec"),
    supabase.from("transcript_chunks").select("id,start_sec,end_sec,text").eq("lesson_id", lessonId).order("start_sec"),
    supabase.from("quiz_questions").select("id,lesson_id,topic_marker_id,question,options,source_start_sec").eq("lesson_id", lessonId).eq("active",true).order("source_start_sec"),
  ]);
  for (const result of [l, m, c, q]) if (result.error) throw new Error(result.error.message);
  if (!l.data) throw new Error("Lesson not found.");
  return { lesson: l.data, markers: m.data ?? [], chunks: c.data ?? [], questions: q.data ?? [] };
}

export async function loadStats(lessonId = SEED_LESSON_ID) {
  const [p, a, r, interviews] = await Promise.all([
    supabase.from("user_progress").select("*").eq("lesson_id", lessonId).maybeSingle(),
    supabase.from("quiz_attempts").select("correct,created_at,question_id").order("created_at", { ascending: false }),
    supabase.from("revision_items").select("*, topic_markers(id,title,start_sec,lesson_id)").order("due_at"),
    supabase.from("interview_sessions").select("*").order("created_at", { ascending: false }),
  ]);
  for (const result of [p, a, r, interviews]) if (result.error) throw new Error(result.error.message);
  const attempts = a.data ?? [];
  const correct = attempts.filter((x) => x.correct).length;
  const due = (r.data ?? []).filter((x) => new Date(x.due_at) <= new Date());
  const days = new Set(attempts.map((x) => x.created_at.slice(0, 10)));
  let streak = 0;
  for (let d = new Date(); days.has(d.toISOString().slice(0, 10)); d.setDate(d.getDate() - 1)) streak++;
  const needsWork = new Set((r.data ?? []).filter((x) => x.last_result === "wrong").map((x) => x.topic_marker_id)).size;
  return {
    maxWatched: p.data?.max_watched_sec ?? 0,
    attempts,
    score: attempts.length ? Math.round((correct / attempts.length) * 100) : null,
    revision: r.data ?? [],
    due,
    streak,
    needsWork,
    mastered: (r.data ?? []).filter(x => x.last_result === "correct" && x.interval_days >= 1).length,
    interviews: interviews.data ?? [],
  };
}
