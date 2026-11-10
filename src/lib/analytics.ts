import type { LmsSnapshot, Member, ScoreRow, SetCode } from '@/types';

export const PASS_MARK = 60;
export const CHAPTER_COUNT = 7;
export const XP_PER_LEVEL = 250;

export type StudentStats = {
  student: Member;
  scoreByChapter: Array<number | null>;
  average: number | null;
  improvement: number | null;
  weakChapters: number[];
  completedCount: number;
  overallRank: number;
  setRank: number;
};

export type SetSummary = {
  set: SetCode;
  studentCount: number;
  averageScore: number | null;
  completionRate: number;
  needsSupportCount: number;
  weakestChapter: number | null;
  chapterAverages: Array<number | null>;
};

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return round1(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function competitionRank(average: number | null, pool: Array<number | null>): number {
  if (average === null) return pool.length + 1;
  return 1 + pool.filter((other) => other !== null && other > average).length;
}

export function levelFor(xp: number) {
  return {
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    progress: (xp % XP_PER_LEVEL) / XP_PER_LEVEL,
    intoLevel: xp % XP_PER_LEVEL,
  };
}

export function buildStudentStats(snapshot: LmsSnapshot): StudentStats[] {
  const scoresByStudent = new Map<string, ScoreRow[]>();
  for (const row of snapshot.scores) {
    const list = scoresByStudent.get(row.student_id) ?? [];
    list.push(row);
    scoresByStudent.set(row.student_id, list);
  }

  const students = snapshot.members.filter((member) => member.role === 'student');

  const base = students.map((student) => {
    const rows = scoresByStudent.get(student.id) ?? [];
    const scoreByChapter: Array<number | null> = Array.from({ length: CHAPTER_COUNT }, () => null);
    for (const row of rows) scoreByChapter[row.chapter_no - 1] = row.score;

    const scored = rows.filter((row) => row.prior_score !== null).sort((a, b) => b.chapter_no - a.chapter_no);
    const latest = scored[0];
    const improvement = latest && latest.prior_score !== null ? Math.round(latest.score - latest.prior_score) : null;

    const weakChapters = rows
      .filter((row) => row.score < PASS_MARK)
      .sort((a, b) => a.score - b.score)
      .map((row) => row.chapter_no);

    const completedCount = snapshot.progress.filter(
      (row) => row.student_id === student.id && row.status === 'completed',
    ).length;

    return {
      student,
      scoreByChapter,
      average: mean(rows.map((row) => row.score)),
      improvement,
      weakChapters,
      completedCount,
    };
  });

  const overallAverages = base.map((entry) => entry.average);

  return base.map((entry) => {
    const setPeers = base
      .filter((other) => other.student.set_code === entry.student.set_code)
      .map((other) => other.average);
    return {
      ...entry,
      overallRank: competitionRank(entry.average, overallAverages),
      setRank: competitionRank(entry.average, setPeers),
    };
  });
}

export function buildSetSummary(stats: StudentStats[], set: SetCode): SetSummary {
  const members = stats.filter((entry) => entry.student.set_code === set);
  const allScores = members.flatMap((entry) => entry.scoreByChapter.filter((value): value is number => value !== null));

  const chapterAverages = Array.from({ length: CHAPTER_COUNT }, (_, index) => {
    const values = members
      .map((entry) => entry.scoreByChapter[index])
      .filter((value): value is number => value !== null);
    return mean(values);
  });

  let weakestChapter: number | null = null;
  let lowest = Infinity;
  chapterAverages.forEach((average, index) => {
    if (average !== null && average < lowest) {
      lowest = average;
      weakestChapter = index + 1;
    }
  });

  const completed = members.reduce((sum, entry) => sum + entry.completedCount, 0);

  return {
    set,
    studentCount: members.length,
    averageScore: mean(allScores),
    completionRate: members.length === 0 ? 0 : completed / (members.length * CHAPTER_COUNT),
    needsSupportCount: members.filter((entry) => entry.weakChapters.length > 0).length,
    weakestChapter,
    chapterAverages,
  };
}
