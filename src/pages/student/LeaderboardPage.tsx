import { useMemo, useState } from 'react';
import { Crown, Medal, Trophy } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ScoreBadge from '@/components/ScoreBadge';
import type { StudentStats } from '@/lib/analytics';
import { formatSigned } from '@/lib/scoreStyles';
import type { SetFilter } from '@/types';

const FILTERS: Array<{ id: SetFilter; label: string }> = [
  { id: 'all', label: 'Overall S2' },
  { id: 'S2M3', label: 'S2M3' },
  { id: 'S2M5', label: 'S2M5' },
];

const FRAME = {
  1: { ring: 'ring-accent-400 bg-accent-50', medal: 'bg-accent-400 text-accent-900', label: 'Gold', Icon: Crown },
  2: { ring: 'ring-slate-300 bg-slate-50', medal: 'bg-slate-300 text-slate-800', label: 'Silver', Icon: Medal },
  3: { ring: 'ring-warning-300 bg-warning-50', medal: 'bg-warning-400 text-warning-900', label: 'Bronze', Icon: Medal },
} as const;

type LeaderboardPageProps = {
  stats: StudentStats[];
  viewerId: string;
};

type Ranked = StudentStats & { rankInView: number };

export default function LeaderboardPage({ stats, viewerId }: LeaderboardPageProps) {
  const [filter, setFilter] = useState<SetFilter>('all');

  const ranked: Ranked[] = useMemo(() => {
    const pool = stats
      .filter((entry) => filter === 'all' || entry.student.set_code === filter)
      .sort((a, b) => (b.average ?? -1) - (a.average ?? -1));
    return pool.map((entry) => ({
      ...entry,
      rankInView: entry.average === null ? pool.length : pool.findIndex((other) => other.average === entry.average) + 1,
    }));
  }, [stats, filter]);

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div className="space-y-8">
      <div className="animate-rise-in flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-wider text-primary-700">Leaderboard</p>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-extrabold text-slate-900">
            <Trophy className="h-7 w-7 text-accent-500" aria-hidden="true" />
            Class ranking
          </h1>
        </div>
        <div role="tablist" aria-label="Filter by set" className="flex rounded-2xl bg-slate-200/70 p-1">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={`rounded-xl px-4 py-2 text-sm font-extrabold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                filter === item.id ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="card p-10 text-center text-sm font-bold text-slate-500">No students in this set yet.</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {podium.map((entry, index) => {
              const place = (index + 1) as 1 | 2 | 3;
              const frame = FRAME[place];
              const FrameIcon = frame.Icon;
              const isViewer = entry.student.id === viewerId;
              return (
                <article
                  key={entry.student.id}
                  className={`animate-rise-in relative flex flex-col items-center rounded-3xl p-6 text-center ring-4 ${frame.ring} ${
                    place === 1 ? 'md:-translate-y-4 md:py-8' : ''
                  } ${isViewer ? 'shadow-xl' : 'shadow-card'}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full shadow-sm ${frame.medal}`}>
                    <FrameIcon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <p className="mt-2 text-xs font-extrabold uppercase tracking-widest text-slate-600">{frame.label}</p>
                  <div className="mt-3">
                    <Avatar name={entry.student.full_name} size="md" tone={place === 1 ? 'accent' : 'primary'} />
                  </div>
                  <p className="mt-3 text-base font-extrabold text-slate-900">
                    {entry.student.full_name}
                    {isViewer && <span className="ml-2 rounded-full bg-primary-600 px-2 py-0.5 text-[11px] text-white">You</span>}
                  </p>
                  <p className="text-xs font-bold text-slate-500">{entry.student.set_code}</p>
                  <div className="mt-3">
                    <ScoreBadge score={entry.average} size="md" />
                  </div>
                </article>
              );
            })}
          </div>

          {rest.length > 0 && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Rank</th>
                      <th className="px-5 py-3">Student</th>
                      <th className="px-5 py-3">Set</th>
                      <th className="px-5 py-3">Average</th>
                      <th className="px-5 py-3">Improvement</th>
                      <th className="px-5 py-3">XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rest.map((entry) => {
                      const isViewer = entry.student.id === viewerId;
                      return (
                        <tr key={entry.student.id} className={`transition-colors hover:bg-primary-50/40 ${isViewer ? 'bg-primary-50' : ''}`}>
                          <td className="px-5 py-3 font-extrabold text-slate-700">#{entry.rankInView}</td>
                          <td className="px-5 py-3 font-extrabold text-slate-900">
                            {entry.student.full_name}
                            {isViewer && <span className="ml-2 rounded-full bg-primary-600 px-2 py-0.5 text-[11px] text-white">You</span>}
                          </td>
                          <td className="px-5 py-3 font-bold text-slate-600">{entry.student.set_code}</td>
                          <td className="px-5 py-3">
                            <ScoreBadge score={entry.average} />
                          </td>
                          <td className="px-5 py-3 font-bold text-success-700">{formatSigned(entry.improvement)}</td>
                          <td className="px-5 py-3 font-extrabold text-accent-700">{entry.student.xp.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
