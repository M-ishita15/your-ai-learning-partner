CREATE TABLE public.lesson_notes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 lesson_id uuid NOT NULL REFERENCES public.lessons(id),
 title text NOT NULL DEFAULT '' CHECK (char_length(title) <= 120),
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 12000),
 position_sec integer NOT NULL DEFAULT 0 CHECK (position_sec BETWEEN 0 AND 36000),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_notes TO authenticated;
GRANT ALL ON public.lesson_notes TO service_role;
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_lesson_notes ON public.lesson_notes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX lesson_notes_user_lesson ON public.lesson_notes(user_id, lesson_id, created_at DESC);