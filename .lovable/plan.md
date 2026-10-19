# Coherence — build plan (phased)

Lesson video: the lecture shown in your screenshots — MIT OpenCourseWare 8.04 "Quantum mechanics as a framework. Defining linearity" (17:46). Its YouTube captions are used as the seeded transcript; you can replace it later via the admin paste box.

## Phase 1 (this round)
- Recreate the look from your screenshots: soft mint/teal palette, deep teal buttons, monospace eyebrow labels, rounded cards, atom illustration, dark bottom nav (Home, Workspace, Interview, Revise, History), breadcrumb header with avatar.
- Sign in with email and Google.
- Lesson data stored in Lovable Cloud: lesson, transcript chunks (~25s), topic markers (0:00, 3:30, 10:50), 8 quiz questions.
- Home: real progress %, practice score, items due, Continue learning card, learning pulse (streak, mastered vs needs-work).
- Workspace: YouTube player, clickable markers, live "Watched up to mm:ss" badge, lesson note + transcript excerpt for the current moment, quick-practice quiz saved to your account (wrong answers go to Revise).
- Lesson tutor: spoiler-proof answers only from watched part, streaming, citation chips that seek the video, "Why this answer?" panel, distinct "can't find this in what you've watched" card with "Where is this covered later?".

## Phase 2
- Mock interview: 3 questions, typed or voice answers, 4-part scorecard with quotes from your answers, "Revisit at mm:ss" link, shareable read-only link.
- Revise: due queue (spaced repetition), Explain it back (graded against transcript), Flashcard moment.
- History: quiz attempts, saved interviews, score trend.

## Phase 3
- Add your own lesson (YouTube link or paste/upload .srt/.vtt) with auto summary, markers and quiz.
- Admin transcript paste, per-user AI rate limits, fallback sample output.

## Technical notes
- TanStack Start server functions replace "Edge Functions" (same security: keys stay server-side).
- Lovable AI Gateway, structured output validated with zod, retry once.
- Postgres full-text search for retrieval, filtered by start_sec <= watched position.
- RLS on every table; lessons readable by all.
