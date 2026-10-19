
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null, source text not null default '', youtube_id text, duration_sec int not null default 0,
  summary text not null default '', note text not null default '', created_at timestamptz not null default now()
);
create table public.transcript_chunks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  start_sec int not null, end_sec int not null, text text not null,
  tsv tsvector generated always as (to_tsvector('english', text)) stored
);
create index on public.transcript_chunks using gin(tsv);
create index on public.transcript_chunks(lesson_id, start_sec);
create table public.topic_markers (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  start_sec int not null, title text not null, summary text not null default ''
);
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  topic_marker_id uuid references public.topic_markers(id) on delete set null,
  question text not null, options jsonb not null, answer_index int not null, explanation text not null default '', source_start_sec int not null default 0
);
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  correct boolean not null, created_at timestamptz not null default now()
);
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  role text not null, content text not null, citations jsonb not null default '[]', retrieved jsonb not null default '[]',
  watched_up_to_sec int not null default 0, grounded boolean not null default true, created_at timestamptz not null default now()
);
create table public.revision_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(),
  topic_marker_id uuid not null references public.topic_markers(id) on delete cascade,
  ease numeric not null default 2.5, interval_days int not null default 0, due_at timestamptz not null default now(),
  last_result text, unique(user_id, topic_marker_id)
);
create table public.user_progress (
  user_id uuid not null default auth.uid(), lesson_id uuid not null references public.lessons(id) on delete cascade,
  max_watched_sec int not null default 0, updated_at timestamptz not null default now(), primary key(user_id, lesson_id)
);

grant select on public.lessons, public.transcript_chunks, public.topic_markers, public.quiz_questions to anon, authenticated;
grant select, insert, update, delete on public.quiz_attempts, public.chat_messages, public.revision_items, public.user_progress to authenticated;
grant all on all tables in schema public to service_role;

alter table public.lessons enable row level security;
alter table public.transcript_chunks enable row level security;
alter table public.topic_markers enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.chat_messages enable row level security;
alter table public.revision_items enable row level security;
alter table public.user_progress enable row level security;

create policy "read lessons" on public.lessons for select using (true);
create policy "read chunks" on public.transcript_chunks for select using (true);
create policy "read markers" on public.topic_markers for select using (true);
create policy "read quiz" on public.quiz_questions for select using (true);
create policy "own attempts" on public.quiz_attempts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own chat" on public.chat_messages for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own revision" on public.revision_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own progress" on public.user_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Wrong quiz answers feed the revision queue (SM-2 lite)
create or replace function public.quiz_attempt_to_revision() returns trigger language plpgsql security definer set search_path = public as $$
declare m uuid;
begin
  select topic_marker_id into m from quiz_questions where id = new.question_id;
  if m is null then return new; end if;
  if not new.correct then
    insert into revision_items(user_id, topic_marker_id, ease, interval_days, due_at, last_result)
    values (new.user_id, m, 2.3, 0, now(), 'wrong')
    on conflict (user_id, topic_marker_id) do update set ease = greatest(1.3, revision_items.ease - 0.2), interval_days = 0, due_at = now(), last_result = 'wrong';
  else
    update revision_items set interval_days = greatest(1, round(interval_days * ease)::int), due_at = now() + make_interval(days => greatest(1, round(interval_days * ease)::int)), last_result = 'correct'
    where user_id = new.user_id and topic_marker_id = m;
  end if;
  return new;
end $$;
create trigger trg_quiz_revision after insert on public.quiz_attempts for each row execute function public.quiz_attempt_to_revision();

-- Time-gated retrieval
create or replace function public.match_chunks(_lesson uuid, _query text, _upto int, _limit int default 4)
returns table(id uuid, start_sec int, end_sec int, text text, rank real) language sql stable set search_path = public as $$
  select c.id, c.start_sec, c.end_sec, c.text, ts_rank(c.tsv, to_tsquery('english', _query)) as rank
  from transcript_chunks c
  where c.lesson_id = _lesson and c.start_sec <= _upto and c.tsv @@ to_tsquery('english', _query)
  order by rank desc limit _limit
$$;
create or replace function public.match_later(_lesson uuid, _query text, _upto int)
returns table(start_sec int, title text) language sql stable set search_path = public as $$
  select c.start_sec, coalesce((select m.title from topic_markers m where m.lesson_id = _lesson and m.start_sec <= c.start_sec order by m.start_sec desc limit 1), 'Later in the lesson')
  from transcript_chunks c
  where c.lesson_id = _lesson and c.start_sec > _upto and c.tsv @@ to_tsquery('english', _query)
  order by ts_rank(c.tsv, to_tsquery('english', _query)) desc limit 1
$$;
grant execute on function public.match_chunks, public.match_later to anon, authenticated;

-- Seed lesson
insert into public.lessons(id, title, source, youtube_id, duration_sec, summary, note) values
('11111111-1111-1111-1111-111111111111', 'Quantum mechanics as a framework', 'MIT OpenCourseWare · 8.04 Quantum Physics I', 'jANZxzetPaQ', 1066,
 'A foundational MIT lecture introduces quantum mechanics and explains what it means for a theory to be linear.',
 'The lecture distinguishes the general principles of quantum mechanics from the particular fields where those principles are applied.');

insert into public.topic_markers(id, lesson_id, start_sec, title, summary) values
('22222222-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',0,'Quantum mechanics as a framework','A framework for physics'),
('22222222-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',210,'Defining linearity','What linearity means'),
('22222222-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111',650,'Scaling and adding solutions','Build a new solution');

insert into public.transcript_chunks(lesson_id, start_sec, end_sec, text)
select '11111111-1111-1111-1111-111111111111', s, s+30, t from (values
(0,'Welcome to the course. Quantum mechanics is a framework for doing physics. It is not a single theory of one phenomenon; it is a set of general principles.'),
(30,'Quantum mechanics replaces classical physics as the fundamental description of nature. Classical mechanics is an approximation that works well for large objects.'),
(60,'The framework can be applied to many different physical phenomena: atoms, molecules, solids, nuclei, light and particle physics all use the same rules.'),
(90,'When you apply quantum mechanics to electromagnetism you get quantum electrodynamics. Applied to particles and forces you get quantum field theory.'),
(120,'So we should think of quantum mechanics as the language, and of particular theories as things written in that language for a specific system.'),
(150,'The principles of quantum mechanics have been tested to extraordinary precision and no experiment has contradicted them so far.'),
(180,'One of the key features of the framework is that it is a linear theory. Before we use that idea we need to define what linearity means.'),
(210,'Defining linearity. A theory is linear when its equations are linear in the unknown. We write the equation as an operator L acting on the unknown u equals zero.'),
(240,'The operator L is linear if L acting on a times u equals a times L acting on u, for any number a. Scaling the unknown scales the result.'),
(270,'And L acting on the sum u1 plus u2 equals L u1 plus L u2. The operator distributes over addition. These two properties together define a linear operator.'),
(300,'Maxwell''s equations in vacuum are an example of a linear theory. The electric and magnetic fields appear only to the first power.'),
(330,'Because of this, the electromagnetic waves from two sources simply add. Two light beams can cross without disturbing each other.'),
(360,'An equation with a term like u squared, or u times its derivative, is nonlinear. Then the sum of two solutions is generally not a solution.'),
(390,'Classical mechanics often leads to nonlinear equations. Newton''s laws with realistic forces are typically nonlinear, which makes them hard to solve.'),
(420,'Let us look at a simple example: the derivative of u with respect to time plus one over tau times u equals zero. Here L is d over dt plus one over tau.'),
(450,'Check the two properties: the derivative of a times u is a times the derivative of u, and the derivative of a sum is the sum of the derivatives. So L is linear.'),
(480,'Now add a term u squared to the equation. L acting on a times u produces a squared times u squared, which is not a times L u. Linearity fails.'),
(510,'In quantum mechanics the central equation is the Schrodinger equation, and it is linear in the wavefunction. This is a deep and exact statement.'),
(540,'Physicists have looked for small nonlinear corrections to the Schrodinger equation and have found none. Quantum mechanics appears to be exactly linear.'),
(570,'Linearity is what lets us talk about superposition. It is the mathematical reason quantum states can be combined.'),
(600,'To summarize the definition: a linear operator respects scaling and respects addition. Keep both conditions in mind.'),
(630,'Now we will see the most important consequence of linearity, which is how we build new solutions from old ones.'),
(650,'Scaling and adding solutions. Suppose u1 is a solution, so L u1 equals zero. Then a times u1 is also a solution, because L of a u1 is a times zero, which is zero.'),
(680,'Suppose u2 is another solution. Then u1 plus u2 is a solution too, since L of the sum is L u1 plus L u2, which is zero plus zero.'),
(710,'Combining both, any linear combination a1 u1 plus a2 u2 is a solution. This is the superposition principle for linear equations.'),
(740,'This lets you build a new solution from known ones. If you find a few simple solutions you can form infinitely many more.'),
(770,'For nonlinear equations this fails. The sum of two solutions is not a solution, so you cannot assemble complicated solutions from simple pieces.'),
(800,'In quantum mechanics, if two wavefunctions describe possible states of a system, then their sum, with complex coefficients, is also a possible state.'),
(830,'The coefficients can be complex numbers. Complex numbers are not optional in quantum mechanics; they are built into the framework.'),
(860,'This superposition of states is very different from the superposition of waves in classical physics. It concerns the state of a single system.'),
(890,'An electron can be in a superposition of being here and being there. A measurement finds it in one place, with probabilities set by the coefficients.'),
(920,'We will return to the meaning of these superpositions many times in the course. For now the key message is the mathematical one.'),
(950,'Linearity allows scaling and adding solutions, and that is why superposition is possible in quantum mechanics.'),
(980,'In the next lectures we will look at experiments, such as the photon and polarizers, that show why superposition is needed.'),
(1010,'Let me review: quantum mechanics is a framework, the theory is linear, and linear combinations of solutions are solutions.'),
(1040,'That completes the introduction. Next time we start with the photoelectric effect and the particle nature of light.')
) v(s,t);

insert into public.quiz_questions(lesson_id, topic_marker_id, question, options, answer_index, explanation, source_start_sec) values
('11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000001','How does the lecture describe quantum mechanics?','["As a general framework that can be applied to different physical phenomena.","As a single experiment about light passing through two slits.","As a replacement for mathematics in physics.","As a theory that only applies to electromagnetism."]',0,'Quantum mechanics is a framework — a set of principles applied to many systems.',0),
('11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000001','What does quantum mechanics replace as the fundamental description of nature?','["Thermodynamics","Classical physics","Relativity","Chemistry"]',1,'It replaces classical physics; classical mechanics becomes an approximation.',30),
('11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000001','Applying quantum mechanics to electromagnetism gives…','["General relativity","Statistical mechanics","Quantum electrodynamics","Fluid dynamics"]',2,'QED is quantum mechanics applied to electromagnetism.',90),
('11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000002','Which pair of properties defines a linear operator L?','["L(au)=aL(u) and L(u1+u2)=L(u1)+L(u2)","L(u)=u and L(0)=1","L(u²)=L(u)² only","L is always a derivative"]',0,'Linearity means respecting scaling and addition.',240),
('11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000002','Which equation is NOT linear?','["du/dt + u/τ = 0","du/dt + u/τ + u² = 0","Maxwell''s equations in vacuum","The Schrödinger equation"]',1,'The u² term breaks the scaling property.',480),
('11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000002','What has been found when searching for nonlinear corrections to the Schrödinger equation?','["Large corrections","Small but measurable corrections","None so far","Corrections only for light"]',2,'Quantum mechanics appears to be exactly linear.',540),
('11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000003','If u1 and u2 solve a linear equation, which is also a solution?','["u1 × u2","u1²","a1·u1 + a2·u2","Only u1 − u2 when equal"]',2,'Any linear combination of solutions is a solution.',710),
('11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000003','In quantum mechanics, the coefficients in a superposition can be…','["Only positive integers","Complex numbers","Only zero or one","Only real fractions"]',1,'Complex numbers are built into the framework.',830);
