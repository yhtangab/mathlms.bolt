import { Flame, Medal, Star, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { levelFor, XP_PER_LEVEL, type StudentStats } from '@/lib/analytics';
import { formatSigned } from '@/lib/scoreStyles';
import type { Chapter } from '@/types';

type StudentCardProps = {
  stats: StudentStats;
  chapters: Chapter[];
};

export default function StudentCard({ stats, chapters }: StudentCardProps) {
  const { student, improvement, weakChapters, overallRank, setRank } = stats;
  const { level, intoLevel } = levelFor(student.xp);
  const titleFor = (chapterNo: number) => chapters.find((chapter) => chapter.chapter_no === chapterNo)?.title ?? `Chapter ${chapterNo}`;

  const ImprovementIcon = improvement === null || improvement === 0 ? Minus : improvement > 0 ? TrendingUp : TrendingDown;
  const improvementText =
    improvement === null
      ? 'No score change recorded yet'
      : improvement > 0
        ? `${formatSigned(improvement)} score increase this month`
        : improvement < 0
          ? `${formatSigned(improvement)} score change this month`
          : 'Score unchanged this month';

  return (
    <section className="animate-rise-in relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 p-6 text-white shadow-xl sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-accent-300/20" aria-hidden="true" />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <span className="rounded-3xl bg-white/15 p-1.5 ring-1 ring-white/30">
            <Avatar name={student.full_name} size="lg" tone="accent" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-2xl font-extrabold sm:text-3xl">{student.full_name}</p>
            <p className="truncate text-sm font-bold text-primary-100">{student.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-primary-800">{student.set_code} Set</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-300 px-3 py-1 text-xs font-extrabold text-accent-900">
                <Medal className="h-3.5 w-3.5" aria-hidden="true" />
                Rank #{setRank} in {student.set_code}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold text-white ring-1 ring-white/30">
                Form Rank #{overallRank}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex min-w-[6.5rem] flex-1 flex-col items-center justify-center rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-white/25">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-300 text-accent-900 shadow-press-accent">
              <Star className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-2 text-xl font-extrabold">{student.xp.toLocaleString()} XP</p>
            <p className="text-xs font-bold text-primary-100">Level {level}</p>
          </div>
          <div className="flex min-w-[6.5rem] flex-1 flex-col items-center justify-center rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-white/25">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-400 text-warning-900">
              <Flame className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-2 text-xl font-extrabold">{student.streak_days} days</p>
            <p className="text-xs font-bold text-primary-100">Daily streak</p>
          </div>
        </div>
      </div>

      <div className="relative mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span>Level {level}</span>
            <span>
              {intoLevel} / {XP_PER_LEVEL} XP
            </span>
          </div>
          <div className="mt-2 rounded-full bg-white/25 p-0.5">
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
              <div className="animate-fill-bar h-full rounded-full bg-accent-300" style={{ width: `${Math.round((intoLevel / XP_PER_LEVEL) * 100)}%` }} />
            </div>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm font-bold text-white">
            <ImprovementIcon className="h-4 w-4 text-accent-200" aria-hidden="true" />
            {improvementText}
          </p>
        </div>

        <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
          <p className="text-xs font-extrabold uppercase tracking-wider text-primary-100">Identified weaker topics</p>
          {weakChapters.length === 0 ? (
            <p className="mt-2 text-sm font-bold text-white">No weak topics right now. Keep it up.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {weakChapters.slice(0, 2).map((chapterNo) => (
                <li key={chapterNo} className="rounded-xl bg-white px-3 py-2 text-sm font-extrabold text-error-800">
                  Needs Practice: Chapter {chapterNo} {titleFor(chapterNo)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
