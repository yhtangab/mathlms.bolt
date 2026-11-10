/*
# HLC Math: assessments, daily marks, wheel attempts, and teacher account

Plain-English summary: adds the data behind the sheet-synced assessment results (six types), the daily marks students earn in class, the list of daily mark reasons, and the record of name-wheel attempts. Also adds an optional HLC number to each member and registers the teacher account yhtang@hlc.edu.hk.

1. Modified Tables
- `s2_members`: new nullable `hlc_number` column (unique when filled in).

2. New Tables
- `s2_assessments`: one row per student per assessment. `assessment_type` is one of short_quiz, chapter_quiz, term_test, exam, mock, homework. Rows come from the Google Sheet sync; the unique key is student + type + title so re-syncing updates rows instead of duplicating them.
- `s2_daily_reasons`: preset and teacher-added reasons for daily marks (for example "Completed Daily Classwork").
- `s2_daily_marks`: each daily mark awarded to a student, with points, reason text, source (daily or wheel), the awarding teacher's email, and the time.
- `s2_wheel_attempts`: each name-wheel result (correct or incorrect) per student and set.

3. Seed Data
- Four starter daily mark reasons.
- Teacher account yhtang@hlc.edu.hk (role teacher, no set).

4. Security
- Row level security is enabled on every new table.
- Reads are allowed for anon and authenticated, matching the existing LMS tables.
- Assessment rows are written only by the server-side sync function (service role); the browser cannot write them.
- Daily marks, reasons, and wheel attempts are readable and writable by anon and authenticated, matching the current class app. Real per-user restriction is a separate, later step.

5. Important Notes
- No existing rows are changed or removed.
- All statements are safe to run twice.
*/

ALTER TABLE s2_members ADD COLUMN IF NOT EXISTS hlc_number text;
CREATE UNIQUE INDEX IF NOT EXISTS s2_members_hlc_number_key ON s2_members (hlc_number) WHERE hlc_number IS NOT NULL;

INSERT INTO s2_members (email, full_name, role)
VALUES ('yhtang@hlc.edu.hk', 'Y. H. Tang', 'teacher')
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS s2_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES s2_members(id) ON DELETE CASCADE,
  assessment_type text NOT NULL CHECK (assessment_type IN ('short_quiz', 'chapter_quiz', 'term_test', 'exam', 'mock', 'homework')),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 120),
  score numeric(6,2) NOT NULL CHECK (score >= 0),
  max_score numeric(6,2) NOT NULL DEFAULT 100 CHECK (max_score > 0 AND score <= max_score),
  taken_on date,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, assessment_type, title)
);

CREATE TABLE IF NOT EXISTS s2_daily_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE CHECK (length(trim(label)) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS s2_daily_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES s2_members(id) ON DELETE CASCADE,
  points integer NOT NULL CHECK (points BETWEEN 1 AND 10),
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 120),
  source text NOT NULL DEFAULT 'daily' CHECK (source IN ('daily', 'wheel')),
  awarded_by text NOT NULL CHECK (length(trim(awarded_by)) BETWEEN 1 AND 200),
  awarded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS s2_wheel_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES s2_members(id) ON DELETE CASCADE,
  set_code text NOT NULL CHECK (set_code IN ('S2M3', 'S2M5')),
  result text NOT NULL CHECK (result IN ('correct', 'incorrect')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS s2_assessments_student_idx ON s2_assessments (student_id);
CREATE INDEX IF NOT EXISTS s2_daily_marks_student_idx ON s2_daily_marks (student_id);
CREATE INDEX IF NOT EXISTS s2_wheel_attempts_student_idx ON s2_wheel_attempts (student_id);

INSERT INTO s2_daily_reasons (label) VALUES
  ('Completed Daily Classwork'),
  ('Active Participation'),
  ('Helpful Question'),
  ('Homework Submitted On Time')
ON CONFLICT (label) DO NOTHING;

ALTER TABLE s2_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE s2_daily_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE s2_daily_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE s2_wheel_attempts ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON s2_assessments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON s2_assessments TO service_role;
GRANT SELECT, INSERT ON s2_daily_reasons TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON s2_daily_marks TO anon, authenticated;
GRANT SELECT, INSERT ON s2_wheel_attempts TO anon, authenticated;

DROP POLICY IF EXISTS "s2_assessments_select" ON s2_assessments;
CREATE POLICY "s2_assessments_select" ON s2_assessments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "s2_daily_reasons_select" ON s2_daily_reasons;
CREATE POLICY "s2_daily_reasons_select" ON s2_daily_reasons FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "s2_daily_reasons_insert" ON s2_daily_reasons;
CREATE POLICY "s2_daily_reasons_insert" ON s2_daily_reasons FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "s2_daily_marks_select" ON s2_daily_marks;
CREATE POLICY "s2_daily_marks_select" ON s2_daily_marks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "s2_daily_marks_insert" ON s2_daily_marks;
CREATE POLICY "s2_daily_marks_insert" ON s2_daily_marks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "s2_daily_marks_delete" ON s2_daily_marks;
CREATE POLICY "s2_daily_marks_delete" ON s2_daily_marks FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "s2_wheel_attempts_select" ON s2_wheel_attempts;
CREATE POLICY "s2_wheel_attempts_select" ON s2_wheel_attempts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "s2_wheel_attempts_insert" ON s2_wheel_attempts;
CREATE POLICY "s2_wheel_attempts_insert" ON s2_wheel_attempts FOR INSERT TO anon, authenticated WITH CHECK (true);
