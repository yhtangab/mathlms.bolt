export type Role = 'student' | 'teacher';
export type SetCode = 'S2M3' | 'S2M5';
export type SetFilter = 'all' | SetCode;
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type ContentKind = 'video' | 'notes' | 'quiz';

export type Member = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  set_code: SetCode | null;
  xp: number;
  streak_days: number;
};

export type Chapter = {
  chapter_no: number;
  title: string;
};

export type ScoreRow = {
  student_id: string;
  chapter_no: number;
  score: number;
  prior_score: number | null;
};

export type ProgressRow = {
  student_id: string;
  chapter_no: number;
  status: ProgressStatus;
};

export type ContentItem = {
  id: string;
  chapter_no: number;
  kind: ContentKind;
  title: string;
  source: string;
  created_at: string;
};

export type AssessmentType = 'short_quiz' | 'chapter_quiz' | 'term_test' | 'exam' | 'mock' | 'homework';
export type WheelResult = 'correct' | 'incorrect';

export type AssessmentRow = {
  student_id: string;
  assessment_type: AssessmentType;
  title: string;
  score: number;
  max_score: number;
  taken_on: string | null;
  updated_at: string;
};

export type DailyReason = {
  id: string;
  label: string;
};

export type DailyMark = {
  id: string;
  student_id: string;
  points: number;
  reason: string;
  source: 'daily' | 'wheel';
  awarded_by: string;
  awarded_at: string;
};

export type WheelAttempt = {
  id: string;
  student_id: string;
  set_code: SetCode;
  result: WheelResult;
  created_at: string;
};

export type LmsSnapshot = {
  members: Member[];
  chapters: Chapter[];
  scores: ScoreRow[];
  progress: ProgressRow[];
  content: ContentItem[];
  assessments: AssessmentRow[];
  dailyReasons: DailyReason[];
  dailyMarks: DailyMark[];
  wheelAttempts: WheelAttempt[];
};
