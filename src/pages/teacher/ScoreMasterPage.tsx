import { useState } from 'react';
import { Search } from 'lucide-react';
import ScoreBadge from '@/components/ScoreBadge';
import { PASS_MARK, type StudentStats } from '@/lib/analytics';
import { formatSigned } from '@/lib/scoreStyles';
import EditScoresModal from '@/pages/teacher/EditScoresModal';
import type { SetFilter } from '@/types';

type ScoreMasterPageProps = {
  stats: StudentStats[];
  onReload: () => void;
};

export default function ScoreMasterPage({ stats, onReload }: ScoreMasterPageProps) {
  const [setFilter, setSetFilter] = useState<SetFilter>('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<StudentStats | null>(null);

  const term = query.trim().toLowerCase();
  const rows = stats
    .filter((entry) => setFilter === 'all' || entry.student.set_code === setFilter)
    .filter((entry) => term === '' || entry.student.full_name.toLowerCase().includes(term) || entry.student.email.includes(term))
    .sort((a, b) => a.overallRank - b.overallRank);

  return (
    <div className="space-y-6">
      <div className="animate-rise-in flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-wider text-primary-700">Score table</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Student master scores</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Select a student to correct their chapter scores.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or email"
              aria-label="Search students"
              className="w-full rounded-2xl border-2 border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none sm:w-64"
            />
          </label>
          <div role="tablist" aria-label="Filter by set" className="flex rounded-2xl bg-slate-200/70 p-1">
            {(['all', 'S2M3', 'S2M5'] as SetFilter[]).map((item) => (
              <button
                key={item}
                role="tab"
                type="button"
                aria-selected={setFilter === item}
                onClick={() => setSetFilter(item)}
                className={`rounded-xl px-4 py-2 text-sm font-extrabold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  setFilter === item ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item === 'all' ? 'All sets' : item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Set</th>
                <th className="px-4 py-3">Rank</th>
                {[1, 2, 3, 4, 5, 6, 7].map((chapter) => (
                  <th key={chapter} className="px-2 py-3 text-center">Ch {chapter}</th>
                ))}
                <th className="px-4 py-3">Improvement</th>
                <th className="px-4 py-3">Weaker topics</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((entry) => (
                <tr key={entry.student.id} className="transition-colors hover:bg-primary-50/40">
                  <td className="px-4 py-3">
                    <p className="font-extrabold text-slate-900">{entry.student.full_name}</p>
                    <p className="text-xs font-semibold text-slate-500">{entry.student.email}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700">{entry.student.set_code}</td>
                  <td className="px-4 py-3 font-extrabold text-slate-800">
                    #{entry.overallRank} <span className="text-xs font-bold text-slate-500">(set #{entry.setRank})</span>
                  </td>
                  {entry.scoreByChapter.map((score, index) => (
                    <td key={index} className="px-2 py-3 text-center">
                      {score === null ? <span className="text-xs font-bold text-slate-400">--</span> : <ScoreBadge score={score} />}
                    </td>
                  ))}
                  <td className="px-4 py-3 font-extrabold text-success-700">{formatSigned(entry.improvement)}</td>
                  <td className="px-4 py-3">
                    {entry.weakChapters.length === 0 ? (
                      <span className="text-xs font-bold text-slate-400">None</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {entry.weakChapters.map((chapter) => (
                          <span key={chapter} className="rounded-full bg-error-100 px-2 py-0.5 text-[11px] font-extrabold text-error-800" title={`Below ${PASS_MARK}%`}>
                            Ch {chapter}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(entry)}
                      className="rounded-xl bg-primary-50 px-3 py-2 text-xs font-extrabold text-primary-700 transition-colors hover:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      Edit scores
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-8 text-center text-sm font-bold text-slate-500">No students match your filters.</p>}
        </div>
      </div>

      {editing && (
        <EditScoresModal
          entry={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onReload();
          }}
        />
      )}
    </div>
  );
}
