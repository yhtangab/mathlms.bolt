import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type {
  AssessmentRow,
  Chapter,
  ContentItem,
  ContentKind,
  DailyMark,
  DailyReason,
  LmsSnapshot,
  Member,
  ProgressRow,
  ScoreRow,
  SetCode,
  WheelAttempt,
  WheelResult,
} from '@/types';

export type ScoreUpsert = {
  student_id: string;
  chapter_no: number;
  score: number;
  prior_score: number | null;
};

export type DailyMarkInsert = {
  student_id: string;
  points: number;
  reason: string;
  source: 'daily' | 'wheel';
  awarded_by: string;
};

export type SheetSyncResult = {
  synced: number;
  unmatched: Array<{ line: number; student: string }>;
  invalid: Array<{ line: number; reason: string }>;
  synced_at: string;
};

const MEMBER_COLUMNS = 'id, email, full_name, role, set_code, xp, streak_days';

function fail(context: string, error: PostgrestError | null): never {
  console.error(context, error);
  if (error?.code === '42501') throw new Error('You do not have permission to do that.');
  throw new Error('Something went wrong. Please try again.');
}

export async function fetchLmsSnapshot(): Promise<LmsSnapshot> {
  const [members, chapters, scores, progress, content, assessments, reasons, marks, attempts] = await Promise.all([
    supabase.from('s2_members').select(MEMBER_COLUMNS).order('full_name'),
    supabase.from('s2_chapters').select('chapter_no, title').order('chapter_no'),
    supabase.from('s2_scores').select('student_id, chapter_no, score, prior_score'),
    supabase.from('s2_chapter_progress').select('student_id, chapter_no, status'),
    supabase.from('s2_course_content').select('id, chapter_no, kind, title, source, created_at').order('created_at'),
    supabase
      .from('s2_assessments')
      .select('student_id, assessment_type, title, score, max_score, taken_on, updated_at')
      .order('taken_on', { ascending: false }),
    supabase.from('s2_daily_reasons').select('id, label').order('label'),
    supabase
      .from('s2_daily_marks')
      .select('id, student_id, points, reason, source, awarded_by, awarded_at')
      .order('awarded_at', { ascending: false })
      .limit(500),
    supabase
      .from('s2_wheel_attempts')
      .select('id, student_id, set_code, result, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
  ]);

  if (members.error) fail('fetch members', members.error);
  if (chapters.error) fail('fetch chapters', chapters.error);
  if (scores.error) fail('fetch scores', scores.error);
  if (progress.error) fail('fetch progress', progress.error);
  if (content.error) fail('fetch content', content.error);
  if (assessments.error) fail('fetch assessments', assessments.error);
  if (reasons.error) fail('fetch daily reasons', reasons.error);
  if (marks.error) fail('fetch daily marks', marks.error);
  if (attempts.error) fail('fetch wheel attempts', attempts.error);

  return {
    members: (members.data ?? []) as Member[],
    chapters: (chapters.data ?? []) as Chapter[],
    scores: ((scores.data ?? []) as Array<Omit<ScoreRow, 'score' | 'prior_score'> & { score: number | string; prior_score: number | string | null }>).map(
      (row) => ({
        student_id: row.student_id,
        chapter_no: row.chapter_no,
        score: Number(row.score),
        prior_score: row.prior_score === null ? null : Number(row.prior_score),
      }),
    ),
    progress: (progress.data ?? []) as ProgressRow[],
    content: (content.data ?? []) as ContentItem[],
    assessments: ((assessments.data ?? []) as Array<Omit<AssessmentRow, 'score' | 'max_score'> & { score: number | string; max_score: number | string }>).map(
      (row) => ({ ...row, score: Number(row.score), max_score: Number(row.max_score) }),
    ),
    dailyReasons: (reasons.data ?? []) as DailyReason[],
    dailyMarks: (marks.data ?? []) as DailyMark[],
    wheelAttempts: (attempts.data ?? []) as WheelAttempt[],
  };
}

export async function fetchMemberByEmail(email: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from('s2_members')
    .select(MEMBER_COLUMNS)
    .eq('email', email)
    .maybeSingle();
  if (error) fail('fetch member by email', error);
  return (data as Member | null) ?? null;
}

export async function upsertScores(rows: ScoreUpsert[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from('s2_scores')
    .upsert(rows.map((row) => ({ ...row, updated_at: new Date().toISOString() })), {
      onConflict: 'student_id,chapter_no',
    });
  if (error) fail('upsert scores', error);
}

export async function insertContent(input: {
  chapter_no: number;
  kind: ContentKind;
  title: string;
  source: string;
}): Promise<void> {
  const { error } = await supabase.from('s2_course_content').insert(input);
  if (error) fail('insert content', error);
}

export async function deleteContent(id: string): Promise<void> {
  const { error } = await supabase.from('s2_course_content').delete().eq('id', id);
  if (error) fail('delete content', error);
}

export async function insertDailyMarks(rows: DailyMarkInsert[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from('s2_daily_marks').insert(rows);
  if (error) fail('insert daily marks', error);
}

export async function deleteDailyMark(id: string): Promise<void> {
  const { error } = await supabase.from('s2_daily_marks').delete().eq('id', id);
  if (error) fail('delete daily mark', error);
}

export async function insertDailyReason(label: string): Promise<void> {
  const { error } = await supabase.from('s2_daily_reasons').insert({ label });
  if (error) fail('insert daily reason', error);
}

export async function insertWheelAttempt(input: { student_id: string; set_code: SetCode; result: WheelResult }): Promise<void> {
  const { error } = await supabase.from('s2_wheel_attempts').insert(input);
  if (error) fail('insert wheel attempt', error);
}

export async function syncScoreSheet(): Promise<SheetSyncResult> {
  const { data, error } = await supabase.functions.invoke<SheetSyncResult & { error?: string }>('sync-score-sheet');
  if (error) {
    console.error('sync score sheet', error);
    throw new Error('The sheet could not be synced. Check the sheet link and try again.');
  }
  if (!data || data.error || typeof data.synced !== 'number' || !Array.isArray(data.unmatched) || !Array.isArray(data.invalid)) {
    throw new Error(data?.error ?? 'The sheet could not be synced. Please try again.');
  }
  return data;
}
