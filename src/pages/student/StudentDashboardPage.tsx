import { AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import ScoreBadge from '@/components/ScoreBadge';
import StatCard from '@/components/StatCard';
import StatusTag from '@/components/StatusTag';
import { PASS_MARK, type StudentStats } from '@/lib/analytics';
import { formatScore } from '@/lib/scoreStyles';
import StudentCard from '@/pages/student/StudentCard';
import type { LmsSnapshot, ProgressStatus } from '@/types';

type StudentDashboardPageProps = {
  snapshot: LmsSnapshot;
  viewed: StudentStats;
};

export default function StudentDashboardPage({ snapshot, viewed }: StudentDashboardPageProps) {
  const { student, scoreByChapter, average, weakChapters, completedCount, overallRank, setRank } = viewed;
  const firstName = student.full_name.split(' ')[0];

  const statusFor = (chapterNo: number): ProgressStatus =>
    snapshot.progress.find((row) => row.student_id === student.id && row.chapter_no === chapterNo)?.status ?? 'not_started';

  return (
    <div className="space-y-8">
      <div className="animate-rise-in">
        <p className="text-sm font-extrabold uppercase tracking-wider text-primary-700">Student dashboard</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Hi, {firstName}. Ready to level up?</h1>
      </div>

      <StudentCard stats={viewed} chapters={snapshot.chapters} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Target} label="Overall average" value={formatScore(average)} hint={`Pass mark ${PASS_MARK}%`} tone="primary" />
        <StatCard icon={CheckCircle2} label="Chapters completed" value={`${completedCount} / 7`} hint="Across the S2 course" tone="success" />
        <StatCard icon={AlertTriangle} label="Rank in set" value={`#${setRank}`} hint={`${student.set_code} class ranking`} tone="accent" />
        <StatCard icon={Target} label="Form rank" value={`#${overallRank}`} hint="All S2 students" tone="primary" />
      </div>

      {weakChapters.length > 0 ? (
        <section className="card border-error-200 bg-error-50/50 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-error-100 text-error-700">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Weaker topics alert</h2>
              <p className="text-sm font-semibold text-slate-600">These chapters scored below {PASS_MARK}%.</p>
            </div>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {weakChapters.slice(0, 2).map((chapterNo) => {
              const chapter = snapshot.chapters.find((item) => item.chapter_no === chapterNo);
              return (
                <li key={chapterNo} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="min-w-0">
                    <span className="inline-block rounded-full bg-error-600 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
                      Recommended Review
                    </span>
                    <p className="mt-2 truncate text-sm font-extrabold text-slate-900">
                      Chapter {chapterNo}: {chapter?.title}
                    </p>
                  </div>
                  <ScoreBadge score={scoreByChapter[chapterNo - 1]} size="md" />
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="card flex items-center gap-3 border-success-200 bg-success-50/60 p-6">
          <CheckCircle2 className="h-6 w-6 text-success-700" aria-hidden="true" />
          <p className="text-sm font-extrabold text-success-900">No chapters below {PASS_MARK}%. Excellent work this term.</p>
        </section>
      )}

      <section className="card p-6 sm:p-8">
        <h2 className="text-lg font-extrabold text-slate-900">Progress timeline: Chapters 1 to 7</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">Complete each chapter to unlock the next milestone.</p>

        <ol className="mt-8 flex gap-3 overflow-x-auto pb-2">
          {snapshot.chapters.map((chapter) => {
            const status = statusFor(chapter.chapter_no);
            const done = status === 'completed';
            const active = status === 'in_progress';
            return (
              <li key={chapter.chapter_no} className="flex min-w-[5.5rem] flex-1 flex-col items-center text-center">
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-extrabold shadow-sm transition-transform duration-300 hover:scale-105 ${
                    done
                      ? 'bg-success-500 text-white shadow-press-success'
                      : active
                        ? 'bg-accent-400 text-accent-900 shadow-press-accent'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {chapter.chapter_no}
                </span>
                <span className="mt-2 text-xs font-extrabold text-slate-700">{formatScore(scoreByChapter[chapter.chapter_no - 1])}</span>
              </li>
            );
          })}
        </ol>

        <ul className="mt-8 divide-y divide-slate-100">
          {snapshot.chapters.map((chapter) => {
            const score = scoreByChapter[chapter.chapter_no - 1];
            const weak = score !== null && score < PASS_MARK;
            return (
              <li key={chapter.chapter_no} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-extrabold text-slate-900">
                      Ch {chapter.chapter_no}. {chapter.title}
                    </p>
                    <StatusTag status={statusFor(chapter.chapter_no)} />
                    {weak && (
                      <span className="rounded-full bg-error-600 px-2 py-0.5 text-[11px] font-extrabold text-white">Recommended Review</span>
                    )}
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={score} label={`Chapter ${chapter.chapter_no} score`} height="sm" />
                  </div>
                </div>
                <ScoreBadge score={score} size="md" />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
