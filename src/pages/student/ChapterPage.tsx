import { BookOpen, FileText, Video, ClipboardCheck } from 'lucide-react';
import StatusTag from '@/components/StatusTag';
import ProgressBar from '@/components/ProgressBar';
import type { StudentStats } from '@/lib/analytics';
import { formatScore } from '@/lib/scoreStyles';
import type { ContentKind, LmsSnapshot, ProgressStatus } from '@/types';

const KIND_META: Record<ContentKind, { label: string; Icon: typeof Video }> = {
  video: { label: 'Video', Icon: Video },
  notes: { label: 'Notes', Icon: FileText },
  quiz: { label: 'Quiz set', Icon: ClipboardCheck },
};

type ChapterPageProps = {
  snapshot: LmsSnapshot;
  viewed: StudentStats;
};

export default function ChapterPage({ snapshot, viewed }: ChapterPageProps) {
  const studentId = viewed.student.id;

  const statusFor = (chapterNo: number): ProgressStatus =>
    snapshot.progress.find((row) => row.student_id === studentId && row.chapter_no === chapterNo)?.status ?? 'not_started';

  return (
    <div className="space-y-8">
      <div className="animate-rise-in">
        <p className="text-sm font-extrabold uppercase tracking-wider text-primary-700">Chapter</p>
        <h1 className="mt-1 flex items-center gap-3 text-3xl font-extrabold text-slate-900">
          <BookOpen className="h-7 w-7 text-primary-600" aria-hidden="true" />
          S2 Mathematics chapters
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Seven chapters for the year. Materials appear here as your teacher publishes them.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {snapshot.chapters.map((chapter, index) => {
          const status = statusFor(chapter.chapter_no);
          const score = viewed.scoreByChapter[chapter.chapter_no - 1];
          const items = snapshot.content.filter((item) => item.chapter_no === chapter.chapter_no);
          const percent = status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0;
          return (
            <article
              key={chapter.chapter_no}
              className="card animate-rise-in flex flex-col p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-lg font-extrabold text-primary-700">
                  {chapter.chapter_no}
                </span>
                <StatusTag status={status} />
              </div>
              <h2 className="mt-4 text-lg font-extrabold leading-snug text-slate-900">{chapter.title}</h2>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs font-extrabold text-slate-500">
                  <span>Your score</span>
                  <span className="text-slate-800">{formatScore(score)}</span>
                </div>
                <ProgressBar value={percent} label={`Chapter ${chapter.chapter_no} progress`} height="sm" tone={status === 'completed' ? 'success' : 'primary'} />
              </div>

              <div className="mt-5 flex-1">
                {items.length === 0 ? (
                  <p className="text-xs font-semibold text-slate-400">Materials coming soon.</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {items.map((item) => {
                      const { label, Icon } = KIND_META[item.kind];
                      return (
                        <li key={item.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          {label}: {item.title}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
