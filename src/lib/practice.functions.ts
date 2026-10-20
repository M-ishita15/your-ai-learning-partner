import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { GeneratedLesson, parseTranscript, youtubeId, ScorecardSchema, validateScorecard } from './lesson-content';
import type { Database, Json } from '@/integrations/supabase/types';

const lessonInput = z.object({ lessonId: z.string().guid() });
const questionSchema = z.object({ questions: z.array(z.object({ question: z.string(), topic_id: z.string() })) });

export const startInterview = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(d => lessonInput.parse(d)).handler(async ({ data, context }) => {
    const { watchedContent, reserve } = await import('./practice.server');
    const content = await watchedContent(context.supabase, data.lessonId);
    if (!content.chunks.length || !content.markers.length) throw new Error('Watch at least the first transcript segment before starting an interview.');
    await reserve(context.supabase);
    const { structured, PROMPTS } = await import('./ai.server');
    const generated = await structured(questionSchema, PROMPTS.interviewer,
      `Ask exactly three distinct questions. Assign a topic_id from these topics: ${JSON.stringify(content.markers)}. Use only this watched transcript: ${JSON.stringify(content.chunks)}`);
    if (generated.questions.length !== 3 || generated.questions.some(q => !q.question.trim() || !content.markers.some(m => m.id === q.topic_id))) throw new Error('The interview questions could not be verified. Please try again.');
    const { data: session, error } = await context.supabase.from('interview_sessions').insert({ lesson_id: data.lessonId, questions: generated.questions }).select('*').single();
    if (error) throw new Error(error.message);
    return session;
  });

export const answerInterview = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(d => z.object({ sessionId: z.string().guid(), index: z.number().int().min(0).max(2), answer: z.string().trim().min(2).max(6000) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const { data: session, error } = await db.from('interview_sessions').select('*').eq('id', data.sessionId).single();
    if (error || !session) throw new Error('Interview not found.');
    if (session.status === 'complete') return session;
    const questions = questionSchema.parse({ questions: session.questions }).questions;
    const { data: turns, error: turnsError } = await db.from('interview_turns').select('*').eq('session_id', session.id).order('turn_index');
    if (turnsError) throw new Error(turnsError.message);
    const saved = turns ?? [];
    if (data.index > saved.length) throw new Error('Answer the questions in order.');
    const question = questions[data.index];
    if (!question) throw new Error('Question not found.');
    if (!saved.some(t => t.turn_index === data.index)) {
      const { error: insertError } = await db.from('interview_turns').insert({ session_id: session.id, turn_index: data.index, question: question.question, answer: data.answer });
      if (insertError) throw new Error(insertError.message);
    }
    return session;
  });

export const scoreInterview = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(d => z.object({ sessionId: z.string().guid() }).parse(d)).handler(async ({ data, context }) => {
    const db = context.supabase;
    const { data: session, error } = await db.from('interview_sessions').select('*').eq('id', data.sessionId).single();
    if (error || !session) throw new Error('Interview not found.');
    if (session.status === 'complete') return session;
    const { data: turns, error: te } = await db.from('interview_turns').select('*').eq('session_id', session.id).order('turn_index');
    if (te) throw new Error(te.message);
    if (turns?.length !== 3) throw new Error('Complete all three answers first.');
    const { watchedContent, reserve, reviseTopic } = await import('./practice.server');
    const content = await watchedContent(db, session.lesson_id);
    await reserve(db);
    const { structured, PROMPTS } = await import('./ai.server');
    const card = validateScorecard(await structured(ScorecardSchema, PROMPTS.scorer,
      `Return exactly four scores with labels Technical knowledge, Communication, Problem solving, Answer structure, integer values 1–5. Each evidence must be a nonempty verbatim quote from one learner answer. Choose weakest_topic_id from the lesson topics and revisit_sec at its start. Topics: ${JSON.stringify(content.markers)}. Transcript: ${JSON.stringify(content.chunks)}. Learner answers: ${JSON.stringify(turns.map(t => ({ question: t.question, answer: t.answer })))}`), turns.map(t => t.answer), content.markers);
    if (card.scores.some(s => s.value <= 2)) await reviseTopic(db, context.userId, card.weakest_topic_id, false);
    const { data: complete, error: saveError } = await db.from('interview_sessions').update({ status: 'complete', scorecard: card }).eq('id', session.id).select('*').single();
    if (saveError) throw new Error(saveError.message);
    return complete;
  });

export const shareScorecard = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(d => z.object({ sessionId: z.string().guid() }).parse(d)).handler(async ({ data, context }) => {
    const db = context.supabase;
    const { data: existing, error } = await db.from('shared_scorecards').select('token').eq('session_id', data.sessionId).maybeSingle();
    if (error) throw new Error(error.message);
    if (existing) return existing.token;
    const { data: row, error: insertError } = await db.from('shared_scorecards').insert({ session_id: data.sessionId }).select('token').single();
    if (insertError) throw new Error(insertError.message);
    return row.token;
  });

export const readSharedScorecard = createServerFn({ method: 'GET' })
  .inputValidator(d => z.object({ token: z.string().guid() }).parse(d)).handler(async ({ data }) => {
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) throw new Error('Shared results are unavailable.');
    const db = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key); return fetch(input, { ...init, headers });
    } } });
    const { data: result, error } = await db.rpc('read_scorecard', { _token: data.token });
    if (error) throw new Error(error.message);
    return result as { title: string; created_at: string; scorecard: z.infer<typeof ScorecardSchema> } | null;
  });

const feedbackSchema = z.object({ score: z.number(), evidence: z.string(), transcript_evidence: z.string(), feedback: z.string(), tip: z.string() });
export const explainBack = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(d => z.object({ lessonId: z.string().guid(), topicId: z.string().guid(), answer: z.string().trim().min(2).max(6000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { watchedContent, reserve, reviseTopic } = await import('./practice.server');
    const content = await watchedContent(context.supabase, data.lessonId);
    const topic = content.markers.find(m => m.id === data.topicId);
    if (!topic) throw new Error('Watch this topic before explaining it back.');
    const { data: next } = await context.supabase.from('topic_markers').select('start_sec').eq('lesson_id', data.lessonId).gt('start_sec', topic.start_sec).order('start_sec').limit(1);
    const chunks = content.chunks.filter(c => c.start_sec >= topic.start_sec && c.start_sec < (next?.[0]?.start_sec ?? Infinity));
    await reserve(context.supabase);
    const { structured, PROMPTS } = await import('./ai.server');
    const feedback = await structured(feedbackSchema, PROMPTS.explain,
      `Topic: ${topic.title}. Transcript: ${JSON.stringify(chunks)}. Learner answer: ${data.answer}. Give an integer score 1–5, a verbatim evidence quote from the learner, and transcript_evidence quoted exactly from one transcript chunk.`);
    if (!Number.isInteger(feedback.score) || feedback.score < 1 || feedback.score > 5 || !feedback.evidence.trim() || !data.answer.includes(feedback.evidence) || !feedback.transcript_evidence.trim() || !chunks.some(c => c.text.includes(feedback.transcript_evidence))) throw new Error('Feedback evidence could not be verified. Please try again.');
    const { error } = await context.supabase.from('explanation_attempts').insert({ lesson_id: data.lessonId, topic_marker_id: data.topicId, answer: data.answer, feedback });
    if (error) throw new Error(error.message);
    await reviseTopic(context.supabase, context.userId, data.topicId, feedback.score >= 3);
    return feedback;
  });

export const importLesson = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(d => z.object({ title: z.string().trim().min(2).max(200), source: z.string().trim().max(200), youtube: z.string().max(1000), transcript: z.string().max(120000), replaceId: z.string().guid().nullable() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.replaceId) {
      const { data: admin, error } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
      if (error || !admin) throw new Error('Only an admin can replace a lesson transcript.');
    }
    const chunks = parseTranscript(data.transcript);
    const videoId = youtubeId(data.youtube);
    const { reserve } = await import('./practice.server');
    await reserve(context.supabase);
    const { structured, PROMPTS } = await import('./ai.server');
    const generated = await structured(GeneratedLesson, PROMPTS.ingest,
      `Generate a summary, 4–8 topic markers and exactly 8 multiple-choice questions with 4 options each. Every marker.start_sec and question.source_start_sec must equal a supplied chunk start_sec. Correct answer_index is an integer 0–3. Use only this transcript: ${JSON.stringify(chunks)}`);
    const starts = new Set(chunks.map(c => c.start_sec));
    if (generated.markers.length < 4 || generated.markers.length > 8 || generated.questions.length !== 8 || generated.markers.some(m => !starts.has(m.start_sec)) || generated.questions.some(q => !starts.has(q.source_start_sec) || q.options.length !== 4 || !Number.isInteger(q.answer_index) || q.answer_index < 0 || q.answer_index > 3)) throw new Error('Generated lesson content could not be verified. Please try again.');
    generated.markers.sort((a, b) => a.start_sec - b.start_sec);
    const { data: id, error } = await context.supabase.rpc('replace_lesson_content', { _lesson: data.replaceId as unknown as string, _title: data.title, _youtube: videoId as unknown as string, _source: data.source, _chunks: chunks as unknown as Json, _generated: generated });
    if (error) throw new Error(error.message);
    return id;
  });

export const generatePractice = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(d => lessonInput.parse(d)).handler(async ({ data, context }) => {
    const { watchedContent, reserve } = await import('./practice.server');
    const content = await watchedContent(context.supabase, data.lessonId);
    if (!content.chunks.length) throw new Error('Watch a transcript segment before generating practice.');
    const { data: weak } = await context.supabase.from('revision_items').select('topic_marker_id').eq('last_result', 'wrong');
    await reserve(context.supabase);
    const { structured, PROMPTS } = await import('./ai.server');
    const schema = z.object({ questions: GeneratedLesson.shape.questions });
    const generated = await structured(schema, PROMPTS.ingest, `Generate exactly 3 questions with 4 options each and integer answer_index 0–3. Focus on weak topic IDs ${JSON.stringify(weak)}. Topics: ${JSON.stringify(content.markers)}. source_start_sec must match a supplied chunk start. Watched transcript: ${JSON.stringify(content.chunks)}`);
    if (generated.questions.length !== 3 || generated.questions.some(q => !content.chunks.some(c => c.start_sec === q.source_start_sec) || q.options.length !== 4 || !Number.isInteger(q.answer_index) || q.answer_index < 0 || q.answer_index > 3)) throw new Error('Practice questions could not be verified.');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.from('quiz_questions').insert(generated.questions.map(q => ({ ...q, lesson_id: data.lessonId, topic_marker_id: [...content.markers].reverse().find(m => m.start_sec <= q.source_start_sec)?.id ?? null })));
    if (error) throw new Error(error.message);
    return true;
  });
