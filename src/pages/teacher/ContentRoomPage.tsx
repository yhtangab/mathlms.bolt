import { useState, type FormEvent } from 'react';
import { ClipboardCheck, FileText, Link as LinkIcon, Trash2, Video } from 'lucide-react';
import { deleteContent, insertContent } from '@/lib/api';
import type { ContentKind, LmsSnapshot } from '@/types';

const KINDS: Array<{ id: ContentKind; label: string; hint: string; placeholder: string; Icon: typeof Video }> = [
  { id: 'video', label: 'Video URL', hint: 'Paste a video link (https://...)', placeholder: 'https://', Icon: Video },
  { id: 'notes', label: 'Chapter notes (PDF)', hint: 'Enter the PDF file name', placeholder: 'Chapter_notes.pdf', Icon: FileText },
  { id: 'quiz', label: 'Quiz question set', hint: 'Name the question set', placeholder: 'Quiz set A (12 questions)', Icon: ClipboardCheck },
];

type ContentRoomPageProps = {
  snapshot: LmsSnapshot;
  onReload: () => void;
};

function isValidVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function ContentRoomPage({ snapshot, onReload }: ContentRoomPageProps) {
  const [chapterNo, setChapterNo] = useState(1);
  const [kind, setKind] = useState<ContentKind>('video');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const chapter = snapshot.chapters.find((item) => item.chapter_no === chapterNo);
  const items = snapshot.content.filter((item) => item.chapter_no === chapterNo);
  const activeKind = KINDS.find((item) => item.id === kind) ?? KINDS[0];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanSource = source.trim();
    if (!cleanTitle) {
      setError('Please give this item a title.');
      return;
    }
    if (kind === 'video' && !isValidVideoUrl(cleanSource)) {
      setError('Please paste a full video link starting with https://');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await insertContent({ chapter_no: chapterNo, kind, title: cleanTitle, source: cleanSource });
      setTitle('');
      setSource('');
      onReload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteContent(id);
      onReload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove this item.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-rise-in">
        <p className="text-sm font-extrabold uppercase tracking-wider text-primary-700">Content room</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Chapter materials</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Add video links, notes and quiz sets as each chapter is ready.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav aria-label="Chapters" className="card flex gap-2 overflow-x-auto p-3 lg:flex-col">
          {snapshot.chapters.map((item) => {
            const count = snapshot.content.filter((content) => content.chapter_no === item.chapter_no).length;
            const active = item.chapter_no === chapterNo;
            return (
              <button
                key={item.chapter_no}
                type="button"
                onClick={() => setChapterNo(item.chapter_no)}
                aria-current={active ? 'true' : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-extrabold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  active ? 'bg-primary-600 text-white shadow-press-primary' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs ${active ? 'bg-white/20' : 'bg-primary-100 text-primary-700'}`}>
                  {item.chapter_no}
                </span>
                <span className="min-w-[6rem] flex-1 truncate lg:min-w-0">{item.title}</span>
                <span className={`rounded-full px-2 text-xs ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>{count}</span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-extrabold text-slate-900">
              Chapter {chapterNo}: {chapter?.title}
            </h2>
            {items.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">Nothing uploaded for this chapter yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {items.map((item) => {
                  const meta = KINDS.find((k) => k.id === item.kind) ?? KINDS[0];
                  const Icon = meta.Icon;
                  return (
                    <li key={item.id} className="flex items-center gap-3 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-100 text-accent-800">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-slate-900">{item.title}</p>
                        <p className="flex items-center gap-1.5 truncate text-xs font-semibold text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-600">{meta.label}</span>
                          {item.source && (
                            <>
                              <LinkIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span className="truncate">{item.source}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                        aria-label={`Remove ${item.title}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-error-50 hover:text-error-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-extrabold text-slate-900">Add content</h2>
            <div role="tablist" aria-label="Content type" className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {KINDS.map((item) => {
                const active = item.id === kind;
                return (
                  <button
                    key={item.id}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => setKind(item.id)}
                    className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-sm font-extrabold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                      active ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <item.Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-extrabold text-slate-600">Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                  placeholder="e.g. Lesson 2 walkthrough"
                  className="mt-1.5 w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 placeholder:font-semibold placeholder:text-slate-400 focus:border-primary-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-extrabold text-slate-600">{activeKind.hint}</span>
                <input
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  maxLength={500}
                  placeholder={activeKind.placeholder}
                  className="mt-1.5 w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 placeholder:font-semibold placeholder:text-slate-400 focus:border-primary-500 focus:outline-none"
                />
              </label>
              {error && (
                <p role="alert" className="rounded-xl bg-error-50 px-4 py-3 text-sm font-bold text-error-800 sm:col-span-2">
                  {error}
                </p>
              )}
              <div className="sm:col-span-2 sm:flex sm:justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="press-button w-full bg-primary-600 text-white shadow-press-primary hover:bg-primary-700 active:translate-y-1 active:shadow-none sm:w-auto"
                >
                  {saving ? 'Saving...' : 'Add to chapter'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
