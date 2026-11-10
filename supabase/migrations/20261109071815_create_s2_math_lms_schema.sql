/*
# Create S2 Math LMS schema

Plain-English summary: adds the tables behind the S2 Mathematics learning platform. It stores school members (students and teachers), the seven curriculum chapters, each student's chapter scores, chapter progress status, and course content slots (video links, notes, quiz sets) that teachers can fill in later.

1. New Tables
- `s2_members`: every person who can sign in. `email` must end in @hlc.edu.hk. Students have a `set_code` (e.g. S2M3); teachers have none. Also stores XP, streak and display name.
- `s2_chapters`: the seven OUP chapters, numbered 1 to 7 with titles.
- `s2_scores`: one row per student per chapter with the current percentage `score` and the `prior_score` used for the improvement index.
- `s2_chapter_progress`: one row per student per chapter with status `not_started`, `in_progress` or `completed`.
- `s2_course_content`: content items per chapter (video URL, chapter notes PDF name, quiz question set).

2. Security
- Row level security is enabled on every new table.
- The app has a simulated school sign-in (no real accounts), so the anon key is used for reads and writes. Policies therefore target `anon, authenticated` and use `USING (true)` on purpose; this is a demo preview and is documented here.
- Grants are limited to the verbs the app uses.

3. Important notes
- Email domain and score range are enforced by CHECK constraints so bad data cannot be stored.
- No existing tables are changed or dropped.
*/

CREATE TABLE IF NOT EXISTS s2_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email) AND email LIKE '%@hlc.edu.hk'),
  full_name text NOT NULL CHECK (length(trim(full_name)) BETWEEN 1 AND 80),
  role text NOT NULL CHECK (role IN ('student', 'teacher')),
  set_code text CHECK (set_code IN ('S2M3', 'S2M5')),
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  streak_days integer NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((role = 'student' AND set_code IS NOT NULL) OR (role = 'teacher' AND set_code IS NULL))
);

CREATE TABLE IF NOT EXISTS s2_chapters (
  chapter_no integer PRIMARY KEY CHECK (chapter_no BETWEEN 1 AND 7),
  title text NOT NULL
);

CREATE TABLE IF NOT EXISTS s2_scores (
  student_id uuid NOT NULL REFERENCES s2_members(id) ON DELETE CASCADE,
  chapter_no integer NOT NULL REFERENCES s2_chapters(chapter_no),
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  prior_score numeric(5,2) CHECK (prior_score IS NULL OR (prior_score >= 0 AND prior_score <= 100)),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, chapter_no)
);

CREATE TABLE IF NOT EXISTS s2_chapter_progress (
  student_id uuid NOT NULL REFERENCES s2_members(id) ON DELETE CASCADE,
  chapter_no integer NOT NULL REFERENCES s2_chapters(chapter_no),
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  PRIMARY KEY (student_id, chapter_no)
);

CREATE TABLE IF NOT EXISTS s2_course_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_no integer NOT NULL REFERENCES s2_chapters(chapter_no),
  kind text NOT NULL CHECK (kind IN ('video', 'notes', 'quiz')),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 120),
  source text NOT NULL DEFAULT '' CHECK (length(source) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS s2_scores_chapter_idx ON s2_scores (chapter_no);
CREATE INDEX IF NOT EXISTS s2_course_content_chapter_idx ON s2_course_content (chapter_no);

ALTER TABLE s2_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE s2_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE s2_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE s2_chapter_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE s2_course_content ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON s2_chapters TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON s2_members TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON s2_scores TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON s2_chapter_progress TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON s2_course_content TO anon, authenticated;

DROP POLICY IF EXISTS "s2_chapters_select" ON s2_chapters;
CREATE POLICY "s2_chapters_select" ON s2_chapters FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "s2_members_select" ON s2_members;
CREATE POLICY "s2_members_select" ON s2_members FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "s2_members_insert" ON s2_members;
CREATE POLICY "s2_members_insert" ON s2_members FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "s2_members_update" ON s2_members;
CREATE POLICY "s2_members_update" ON s2_members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "s2_scores_select" ON s2_scores;
CREATE POLICY "s2_scores_select" ON s2_scores FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "s2_scores_insert" ON s2_scores;
CREATE POLICY "s2_scores_insert" ON s2_scores FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "s2_scores_update" ON s2_scores;
CREATE POLICY "s2_scores_update" ON s2_scores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "s2_scores_delete" ON s2_scores;
CREATE POLICY "s2_scores_delete" ON s2_scores FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "s2_progress_select" ON s2_chapter_progress;
CREATE POLICY "s2_progress_select" ON s2_chapter_progress FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "s2_progress_insert" ON s2_chapter_progress;
CREATE POLICY "s2_progress_insert" ON s2_chapter_progress FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "s2_progress_update" ON s2_chapter_progress;
CREATE POLICY "s2_progress_update" ON s2_chapter_progress FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "s2_progress_delete" ON s2_chapter_progress;
CREATE POLICY "s2_progress_delete" ON s2_chapter_progress FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "s2_content_select" ON s2_course_content;
CREATE POLICY "s2_content_select" ON s2_course_content FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "s2_content_insert" ON s2_course_content;
CREATE POLICY "s2_content_insert" ON s2_course_content FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "s2_content_delete" ON s2_course_content;
CREATE POLICY "s2_content_delete" ON s2_course_content FOR DELETE TO anon, authenticated USING (true);
