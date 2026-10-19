import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fmt, toTsQuery } from "./time";

const Input = z.object({
  lessonId: z.string().uuid(),
  question: z.string().trim().min(2).max(500),
  watchedUpToSec: z.number().int().min(0).max(36000),
});

export type Citation = { start_sec: number; snippet: string };
export type Chunk = { id: string; start_sec: number; end_sec: number; text: string; rank: number };
export type TutorReply = {
  answer: string;
  grounded: boolean;
  citations: Citation[];
  retrieved_chunks: Chunk[];
  watched_up_to_sec: number;
};

const MIN_RANK = 0.02;

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }): Promise<TutorReply> => {
    const { supabase, userId } = context;

    // simple per-user rate limit: 20 questions / 10 minutes
    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const { count } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .gte("created_at", since);
    if ((count ?? 0) >= 20) throw new Error("You're asking quickly! Please wait a few minutes.");

    const q = toTsQuery(data.question);
    let chunks: Chunk[] = [];
    if (q) {
      const { data: rows, error } = await supabase.rpc("match_chunks", {
        _lesson: data.lessonId,
        _query: q,
        _upto: data.watchedUpToSec,
        _limit: 4,
      });
      if (error) console.error(error);
      chunks = ((rows ?? []) as Chunk[]).filter((c) => c.rank >= MIN_RANK);
    }

    await supabase.from("chat_messages").insert({
      user_id: userId,
      lesson_id: data.lessonId,
      role: "user",
      content: data.question,
      watched_up_to_sec: data.watchedUpToSec,
    });

    const refuse = (): TutorReply => ({
      answer: `I can't find this in the part you've watched (up to ${fmt(data.watchedUpToSec)}).`,
      grounded: false,
      citations: [],
      retrieved_chunks: chunks,
      watched_up_to_sec: data.watchedUpToSec,
    });

    let reply: TutorReply;
    if (chunks.length === 0) {
      reply = refuse();
    } else {
      const { structured, PROMPTS } = await import("./ai.server");
      const excerpts = chunks.map((c) => `[${fmt(c.start_sec)}] (start_sec=${c.start_sec}) ${c.text}`).join("\n");
      const schema = z.object({
        answer: z.string(),
        grounded: z.boolean(),
        citations: z.array(z.object({ start_sec: z.number(), snippet: z.string() })),
      });
      const out = await structured(
        schema,
        PROMPTS.tutor,
        `Transcript excerpts (the learner has watched up to ${fmt(data.watchedUpToSec)}):\n${excerpts}\n\nQuestion: ${data.question}\n\nCitations must use start_sec values from the excerpts above and a short snippet quoted from that excerpt.`,
      );
      const allowed = new Set(chunks.map((c) => c.start_sec));
      const citations = out.citations.filter((c) => allowed.has(c.start_sec)).slice(0, 4);
      reply = out.grounded
        ? { ...out, citations, retrieved_chunks: chunks, watched_up_to_sec: data.watchedUpToSec }
        : refuse();
    }

    await supabase.from("chat_messages").insert({
      user_id: userId,
      lesson_id: data.lessonId,
      role: "assistant",
      content: reply.answer,
      citations: reply.citations,
      retrieved: reply.retrieved_chunks,
      grounded: reply.grounded,
      watched_up_to_sec: data.watchedUpToSec,
    });
    return reply;
  });

export const whereLater = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const q = toTsQuery(data.question);
    if (!q) return null;
    const { data: rows } = await context.supabase.rpc("match_later", {
      _lesson: data.lessonId,
      _query: q,
      _upto: data.watchedUpToSec,
    });
    const r = (rows ?? [])[0] as { start_sec: number; title: string } | undefined;
    return r ? { start_sec: r.start_sec, title: r.title } : null;
  });
