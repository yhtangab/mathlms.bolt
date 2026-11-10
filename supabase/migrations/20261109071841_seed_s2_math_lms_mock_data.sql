/*
# Seed S2 Math LMS mock data

Plain-English summary: fills the new platform with realistic demo data so the preview is alive on first open. It adds the seven chapters, one teacher, sixteen students split evenly between S2M3 and S2M5, their chapter scores (with a prior score for the improvement index), their chapter progress, and a couple of sample content items.

1. Inserted rows
- `s2_chapters`: Chapters 1 to 7 of the OUP S2 Mathematics textbook.
- `s2_members`: 1 teacher and 16 students (8 in S2M3, 8 in S2M5) with XP and streak values.
- `s2_scores` and `s2_chapter_progress`: scores for each chapter a student has reached, and matching statuses.
- `s2_course_content`: two sample content items.

2. Security
- No security changes. Rows are inserted with fixed ids so the migration is repeatable on a new database.

3. Important notes
- Scores are generated from a fixed per-student ability level with deterministic variation, so the numbers are stable across rebuilds.
- Re-running is safe: every insert uses ON CONFLICT DO NOTHING.
*/

INSERT INTO s2_chapters (chapter_no, title) VALUES
  (1, 'Approximation and Errors'),
  (2, 'Operations and Factorization of Polynomials'),
  (3, 'Identities'),
  (4, 'Algebraic Fractions and Formulae'),
  (5, 'Linear Equations in Two Unknowns'),
  (6, 'Angles and Parallel Lines (II)'),
  (7, 'Organization and Presentation of Data (II)')
ON CONFLICT (chapter_no) DO NOTHING;

INSERT INTO s2_members (id, email, full_name, role, set_code, xp, streak_days) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'lam.siuwai@hlc.edu.hk', 'Ms. Lam Siu Wai', 'teacher', NULL, 0, 0),
  ('a0000000-0000-4000-8000-000000000001', 'chan.kaho@hlc.edu.hk', 'Chan Ka Ho', 'student', 'S2M3', 1480, 12),
  ('a0000000-0000-4000-8000-000000000002', 'wong.minghei@hlc.edu.hk', 'Wong Ming Hei', 'student', 'S2M3', 1020, 5),
  ('a0000000-0000-4000-8000-000000000003', 'lee.tszyan@hlc.edu.hk', 'Lee Tsz Yan', 'student', 'S2M3', 1690, 21),
  ('a0000000-0000-4000-8000-000000000004', 'cheung.hoilam@hlc.edu.hk', 'Cheung Hoi Lam', 'student', 'S2M3', 610, 2),
  ('a0000000-0000-4000-8000-000000000005', 'ng.chunhei@hlc.edu.hk', 'Ng Chun Hei', 'student', 'S2M3', 1130, 8),
  ('a0000000-0000-4000-8000-000000000006', 'lau.kayan@hlc.edu.hk', 'Lau Ka Yan', 'student', 'S2M3', 890, 4),
  ('a0000000-0000-4000-8000-000000000007', 'ho.wingsze@hlc.edu.hk', 'Ho Wing Sze', 'student', 'S2M3', 1540, 16),
  ('a0000000-0000-4000-8000-000000000008', 'leung.kachun@hlc.edu.hk', 'Leung Ka Chun', 'student', 'S2M3', 380, 0),
  ('a0000000-0000-4000-8000-000000000009', 'yip.hiutung@hlc.edu.hk', 'Yip Hiu Tung', 'student', 'S2M5', 1790, 25),
  ('a0000000-0000-4000-8000-000000000010', 'tsang.hoyin@hlc.edu.hk', 'Tsang Ho Yin', 'student', 'S2M5', 1310, 9),
  ('a0000000-0000-4000-8000-000000000011', 'fung.kwanki@hlc.edu.hk', 'Fung Kwan Ki', 'student', 'S2M5', 960, 6),
  ('a0000000-0000-4000-8000-000000000012', 'yeung.manki@hlc.edu.hk', 'Yeung Man Ki', 'student', 'S2M5', 720, 3),
  ('a0000000-0000-4000-8000-000000000013', 'mak.szeching@hlc.edu.hk', 'Mak Sze Ching', 'student', 'S2M5', 1450, 14),
  ('a0000000-0000-4000-8000-000000000014', 'tam.kawai@hlc.edu.hk', 'Tam Ka Wai', 'student', 'S2M5', 1000, 7),
  ('a0000000-0000-4000-8000-000000000015', 'kwok.tszhin@hlc.edu.hk', 'Kwok Tsz Hin', 'student', 'S2M5', 540, 1),
  ('a0000000-0000-4000-8000-000000000016', 'choi.ngayan@hlc.edu.hk', 'Choi Nga Yan', 'student', 'S2M5', 1620, 18)
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE s2_seed_students (id uuid PRIMARY KEY, ability integer, last_chapter integer) ON COMMIT DROP;
INSERT INTO s2_seed_students (id, ability, last_chapter) VALUES
  ('a0000000-0000-4000-8000-000000000001', 78, 7),
  ('a0000000-0000-4000-8000-000000000002', 66, 6),
  ('a0000000-0000-4000-8000-000000000003', 88, 7),
  ('a0000000-0000-4000-8000-000000000004', 52, 5),
  ('a0000000-0000-4000-8000-000000000005', 71, 6),
  ('a0000000-0000-4000-8000-000000000006', 59, 6),
  ('a0000000-0000-4000-8000-000000000007', 83, 7),
  ('a0000000-0000-4000-8000-000000000008', 47, 4),
  ('a0000000-0000-4000-8000-000000000009', 92, 7),
  ('a0000000-0000-4000-8000-000000000010', 75, 7),
  ('a0000000-0000-4000-8000-000000000011', 64, 6),
  ('a0000000-0000-4000-8000-000000000012', 55, 5),
  ('a0000000-0000-4000-8000-000000000013', 80, 7),
  ('a0000000-0000-4000-8000-000000000014', 69, 6),
  ('a0000000-0000-4000-8000-000000000015', 49, 5),
  ('a0000000-0000-4000-8000-000000000016', 86, 7);

CREATE TEMP TABLE s2_seed_scores ON COMMIT DROP AS
SELECT
  st.id AS student_id,
  ch.chapter_no,
  LEAST(100, GREATEST(20, st.ability + (abs(hashtext(st.id::text || ch.chapter_no::text)) % 21) - 10))::numeric(5,2) AS score,
  LEAST(100, GREATEST(10, st.ability + (abs(hashtext(st.id::text || ch.chapter_no::text || 'p')) % 25) - 14))::numeric(5,2) AS prior_score,
  st.last_chapter
FROM s2_seed_students st
CROSS JOIN generate_series(1, 7) AS ch(chapter_no)
WHERE ch.chapter_no <= st.last_chapter;

INSERT INTO s2_scores (student_id, chapter_no, score, prior_score)
SELECT student_id, chapter_no, score, prior_score FROM s2_seed_scores
ON CONFLICT (student_id, chapter_no) DO NOTHING;

INSERT INTO s2_chapter_progress (student_id, chapter_no, status)
SELECT st.id, ch.chapter_no,
  CASE
    WHEN ch.chapter_no < st.last_chapter THEN 'completed'
    WHEN ch.chapter_no = st.last_chapter THEN 'in_progress'
    ELSE 'not_started'
  END
FROM s2_seed_students st
CROSS JOIN generate_series(1, 7) AS ch(chapter_no)
ON CONFLICT (student_id, chapter_no) DO NOTHING;

INSERT INTO s2_course_content (id, chapter_no, kind, title, source) VALUES
  ('c0000000-0000-4000-8000-000000000001', 1, 'notes', 'Chapter 1 revision notes', 'Ch1_Approximation_Notes.pdf'),
  ('c0000000-0000-4000-8000-000000000002', 4, 'quiz', 'Algebraic fractions quiz set A', 'Quiz_Set_A_12_questions')
ON CONFLICT (id) DO NOTHING;
