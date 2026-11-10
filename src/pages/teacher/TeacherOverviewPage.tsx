import { BarChart3, Trophy, Users, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import StatCard from '@/components/StatCard';
import { buildSetSummary, type StudentStats } from '@/lib/analytics';
import { formatScore } from '@/lib/scoreStyles';
import type { LmsSnapshot, SetCode } from '@/types';

const SETS: SetCode[] = ['S2M3', 'S2M5'];
const SET_BAR: Record<SetCode, string> = { S2M3: 'bg-primary-500', S2M5: 'bg-success-500' };
const SET_TEXT: Record<SetCode, string> = { S2M3: 'text-primary-700', S2M5: 'text-success-700' };

type TeacherOverviewPageProps = {
  snapshot: LmsSnapshot;
  stats: StudentStats[];
};

export default function TeacherOverviewPage({ snapshot, stats }: TeacherOverviewPageProps) {
  const summaries = SETS.map((set) => buildSetSummary(stats, set));
  const totalStudents = summaries.reduce((sum, item) => sum + item.studentCount, 0);
  const totalSupport = summaries.reduce((sum, item) => sum + item.needsSupportCount, 0);

  return (
    <div className="space-y-8">
      <div className="animate-rise-in">
        <p className="text-sm font-extrabold uppercase tracking-wider text-primary-700">Teacher dashboard</p>
        <h1 className="mt-1 flex items-center gap-3 text-3xl font-extrabold text-slate-900">
          <BarChart3 className="h-7 w-7 text-primary-600" aria-hidden="true" />
          Class analytics overview
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Compare S2M3 and S2M5 across scores, completion and weaker topics.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Students" value={String(totalStudents)} hint="Across both sets" tone="primary" />
        <StatCard icon={AlertTriangle} label="Need support" value={String(totalSupport)} hint="Scored below 60% somewhere" tone="error" />
        <StatCard icon={Target} label="Chapters in course" value="7" hint="S2 Mathematics" tone="accent" />
        <StatCard icon={Trophy} label="Students in S2" value={String(snapshot.members.filter((m) => m.role === 'student').length)} hint="Form total" tone="success" />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {summaries.map((summary) => (
          <section key={summary.set} className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-extrabold ${SET_TEXT[summary.set]}`}>{summary.set}</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600">{summary.studentCount} students</span>
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3 text-center">
                <dt className="text-xs font-bold text-slate-500">Average</dt>
                <dd className="mt-1 text-xl font-extrabold text-slate-900">{formatScore(summary.averageScore)}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-center">
                <dt className="text-xs font-bold text-slate-500">Need support</dt>
                <dd className="mt-1 text-xl font-extrabold text-error-700">{summary.needsSupportCount}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-center">
                <dt className="text-xs font-bold text-slate-500">Weakest</dt>
                <dd className="mt-1 text-xl font-extrabold text-slate-900">
                  {summary.weakestChapter ? `Ch ${summary.weakestChapter}` : '--'}
                </dd>
              </div>
            </dl>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-extrabold text-slate-600">
                <span>Completion rate</span>
                <span>{Math.round(summary.completionRate * 100)}%</span>
              </div>
              <ProgressBar value={summary.completionRate * 100} label={`${summary.set} completion rate`} tone={summary.set === 'S2M3' ? 'primary' : 'success'} />
            </div>
          </section>
        ))}
      </div>

      <section className="card p-6 sm:p-8">
        <h2 className="text-lg font-extrabold text-slate-900">Average score by chapter</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">Compare where each set is strongest and weakest.</p>
        <div className="mt-6 space-y-5">
          {snapshot.chapters.map((chapter) => (
            <div key={chapter.chapter_no} className="grid gap-2 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-center sm:gap-4">
              <p className="text-sm font-extrabold text-slate-800">
                Ch {chapter.chapter_no}. <span className="font-bold text-slate-600">{chapter.title}</span>
              </p>
              <div className="space-y-2">
                {summaries.map((summary) => {
                  const value = summary.chapterAverages[chapter.chapter_no - 1];
                  return (
                    <div key={summary.set} className="flex items-center gap-3">
                      <span className="w-12 shrink-0 text-xs font-extrabold text-slate-600">{summary.set}</span>
                      <div className="flex-1">
                        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200/80">
                          <div
                            className={`animate-fill-bar h-full rounded-full ${SET_BAR[summary.set]}`}
                            style={{ width: `${value ?? 0}%` }}
                            role="img"
                            aria-label={`${summary.set} chapter ${chapter.chapter_no} average ${formatScore(value)}`}
                          />
                        </div>
                      </div>
                      <span className="w-12 text-right text-xs font-extrabold text-slate-700">{formatScore(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <CheckCircle2 className="h-4 w-4 text-success-600" aria-hidden="true" />
        Averages count only chapters that have a recorded score.
      </p>
    </div>
  );
}
