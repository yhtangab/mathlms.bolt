/*
# Create assessments and scores with publishing

1. New Tables
- `assessments`: a test, quiz, or assignment set by a teacher for one class. Has a title, topic, maximum mark, date, and a "results published" switch.
- `scores`: one mark per student per assessment.

2. Functions and triggers
- `check_score_bounds()`: rejects any mark below 0 or above the assessment's maximum.
- `get_class_leaderboard()`: returns each student's average percentage and rank for a class, using only published results. Students only ever see their own class. Returns names and ranks, never emails.

3. Security
- RLS enabled on both tables.
- Teachers manage assessments and scores. Students can read an assessment and their own mark only after the teacher publishes results.
- Teachers can only create assessments under their own account.
- Clients can change an assessment's title, topic, maximum mark, date, class, and publish state, but not who created it.

4. Notes
- Results stay hidden from students until the teacher publishes them.
*/

CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 120),
  topic text NOT NULL DEFAULT '' CHECK (length(topic) <= 120),
  max_score numeric(6,1) NOT NULL CHECK (max_score > 0 AND max_score <= 1000),
  assessment_date date NOT NULL DEFAULT current_date,
  class_label text NOT NULL,
  results_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assessments_class_label_idx ON public.assessments (class_label, assessment_date);

CREATE TABLE IF NOT EXISTS public.scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score numeric(6,1) NOT NULL CHECK (score >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, student_id)
);

CREATE INDEX IF NOT EXISTS scores_student_id_idx ON public.scores (student_id);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_score_bounds()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max numeric;
BEGIN
  SELECT max_score INTO v_max FROM public.assessments WHERE id = NEW.assessment_id;
  IF v_max IS NULL THEN
    RAISE EXCEPTION 'Assessment not found';
  END IF;
  IF NEW.score > v_max THEN
    RAISE EXCEPTION 'Score cannot be higher than the maximum mark';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_score_bounds() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS scores_check_bounds ON public.scores;
CREATE TRIGGER scores_check_bounds
  BEFORE INSERT OR UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.check_score_bounds();

CREATE OR REPLACE FUNCTION public.get_class_leaderboard(p_class_label text DEFAULT NULL)
RETURNS TABLE (
  student_id uuid,
  student_name text,
  average_pct numeric,
  rank_position bigint,
  published_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF public.is_teacher() THEN
    v_class := p_class_label;
  ELSE
    SELECT pr.class_label INTO v_class FROM public.profiles pr WHERE pr.id = auth.uid();
  END IF;

  IF v_class IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH class_averages AS (
    SELECT
      pr.id AS s_id,
      pr.full_name AS s_name,
      AVG(sc.score / a.max_score * 100) AS s_avg,
      COUNT(*) AS s_count
    FROM public.profiles pr
    JOIN public.scores sc ON sc.student_id = pr.id
    JOIN public.assessments a ON a.id = sc.assessment_id
    WHERE pr.role = 'student'
      AND pr.class_label = v_class
      AND a.class_label = v_class
      AND a.results_published
    GROUP BY pr.id, pr.full_name
  )
  SELECT
    ca.s_id,
    ca.s_name,
    ROUND(ca.s_avg, 1),
    RANK() OVER (ORDER BY ca.s_avg DESC),
    ca.s_count
  FROM class_averages ca
  ORDER BY 4, 2;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_class_leaderboard(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_class_leaderboard(text) TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT INSERT (title, topic, max_score, assessment_date, class_label) ON public.assessments TO authenticated;
GRANT UPDATE (title, topic, max_score, assessment_date, class_label, results_published, published_at) ON public.assessments TO authenticated;

DROP POLICY IF EXISTS "assessments_select_teacher" ON public.assessments;
CREATE POLICY "assessments_select_teacher" ON public.assessments FOR SELECT
  TO authenticated USING (public.is_teacher());

DROP POLICY IF EXISTS "assessments_select_student_published" ON public.assessments;
CREATE POLICY "assessments_select_student_published" ON public.assessments FOR SELECT
  TO authenticated USING (
    results_published
    AND class_label = (SELECT pr.class_label FROM public.profiles pr WHERE pr.id = auth.uid())
  );

DROP POLICY IF EXISTS "assessments_insert_teacher" ON public.assessments;
CREATE POLICY "assessments_insert_teacher" ON public.assessments FOR INSERT
  TO authenticated WITH CHECK (public.is_teacher() AND created_by = auth.uid());

DROP POLICY IF EXISTS "assessments_update_teacher" ON public.assessments;
CREATE POLICY "assessments_update_teacher" ON public.assessments FOR UPDATE
  TO authenticated USING (public.is_teacher()) WITH CHECK (public.is_teacher());

DROP POLICY IF EXISTS "assessments_delete_teacher" ON public.assessments;
CREATE POLICY "assessments_delete_teacher" ON public.assessments FOR DELETE
  TO authenticated USING (public.is_teacher());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scores TO authenticated;
GRANT INSERT (assessment_id, student_id, score) ON public.scores TO authenticated;
GRANT UPDATE (score) ON public.scores TO authenticated;

DROP POLICY IF EXISTS "scores_select_teacher" ON public.scores;
CREATE POLICY "scores_select_teacher" ON public.scores FOR SELECT
  TO authenticated USING (public.is_teacher());

DROP POLICY IF EXISTS "scores_select_student_published" ON public.scores;
CREATE POLICY "scores_select_student_published" ON public.scores FOR SELECT
  TO authenticated USING (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = scores.assessment_id AND a.results_published
    )
  );

DROP POLICY IF EXISTS "scores_insert_teacher" ON public.scores;
CREATE POLICY "scores_insert_teacher" ON public.scores FOR INSERT
  TO authenticated WITH CHECK (public.is_teacher());

DROP POLICY IF EXISTS "scores_update_teacher" ON public.scores;
CREATE POLICY "scores_update_teacher" ON public.scores FOR UPDATE
  TO authenticated USING (public.is_teacher()) WITH CHECK (public.is_teacher());

DROP POLICY IF EXISTS "scores_delete_teacher" ON public.scores;
CREATE POLICY "scores_delete_teacher" ON public.scores FOR DELETE
  TO authenticated USING (public.is_teacher());
