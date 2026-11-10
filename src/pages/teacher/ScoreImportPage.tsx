import { useMemo, useState, type ChangeEvent, type DragEvent } from 'react';
import { CheckCircle2, FileSpreadsheet, Upload, XCircle } from 'lucide-react';
import { upsertScores, type ScoreUpsert } from '@/lib/api';
import type { StudentStats } from '@/lib/analytics';
import { parseScoreCsv, type CsvScoreRow } from '@/lib/csvScores';

const SAMPLE_CSV = 'email,chapter,score\nchan.kaho@hlc.edu.hk,7,72\nyip.hiutung@hlc.edu.hk,7,88';

type ScoreImportPageProps = {
  stats: StudentStats[];
  onReload: () => void;
};

export default function ScoreImportPage({ stats, onReload }: ScoreImportPageProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<CsvScoreRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const roster = useMemo(() => new Map(stats.map((entry) => [entry.student.email, entry])), [stats]);
  const validRows = rows.filter((row) => row.error === null);
  const invalidCount = rows.length - validRows.length;

  const loadFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setMessage({ tone: 'error', text: 'Please choose a .csv file.' });
      return;
    }
    const text = await file.text();
    setFileName(file.name);
    setMessage(null);
    setRows(parseScoreCsv(text, new Set(roster.keys())));
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void loadFile(file);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void loadFile(file);
  };

  const handleImport = async () => {
    const upserts: ScoreUpsert[] = validRows.map((row) => {
      const entry = roster.get(row.email);
      const chapter = row.chapter_no ?? 0;
      return {
        student_id: entry?.student.id ?? '',
        chapter_no: chapter,
        score: row.score ?? 0,
        prior_score: entry?.scoreByChapter[chapter - 1] ?? null,
      };
    });
    setImporting(true);
    setMessage(null);
    try {
      await upsertScores(upserts);
      setMessage({ tone: 'success', text: `Imported ${upserts.length} score${upserts.length === 1 ? '' : 's'}.` });
      setRows([]);
      setFileName(null);
      onReload();
    } catch (cause) {
      setMessage({ tone: 'error', text: cause instanceof Error ? cause.message : 'Import failed. Please try again.' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-rise-in">
        <p className="text-sm font-extrabold uppercase tracking-wider text-primary-700">Score import</p>
        <h1 className="mt-1 flex items-center gap-3 text-3xl font-extrabold text-slate-900">
          <FileSpreadsheet className="h-7 w-7 text-success-600" aria-hidden="true" />
          Import chapter scores
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Drop a CSV with one score per row. Previous scores are kept for the improvement index.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="card p-6">
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-all duration-200 ${
              dragging ? 'border-primary-500 bg-primary-50 scale-[1.01]' : 'border-slate-300 bg-slate-50 hover:border-primary-400 hover:bg-primary-50/50'
            }`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
              <Upload className="h-7 w-7" aria-hidden="true" />
            </span>
            <span className="text-base font-extrabold text-slate-900">Drop a CSV file here</span>
            <span className="text-sm font-semibold text-slate-500">or click to choose a file</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleFileInput} />
          </label>

          <div className="mt-6 rounded-2xl bg-slate-900 p-4 text-xs text-slate-100">
            <p className="font-extrabold text-accent-300">Expected format</p>
            <pre className="mt-2 overflow-x-auto font-mono leading-relaxed">{SAMPLE_CSV}</pre>
          </div>
          <p className="mt-4 text-xs font-semibold text-slate-500">
            Chapter is 1 to 7 and score is 0 to 100. Emails must match a student on the class roster.
          </p>
        </section>

        <section className="card flex flex-col p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Preview</h2>
              <p className="text-sm font-semibold text-slate-500">{fileName ? fileName : 'No file selected yet'}</p>
            </div>
            {rows.length > 0 && (
              <div className="flex gap-2 text-xs font-extrabold">
                <span className="rounded-full bg-success-100 px-3 py-1 text-success-800">{validRows.length} valid</span>
                {invalidCount > 0 && <span className="rounded-full bg-error-100 px-3 py-1 text-error-800">{invalidCount} invalid</span>}
              </div>
            )}
          </div>

          <div className="mt-5 max-h-80 flex-1 overflow-auto rounded-2xl border border-slate-200">
            {rows.length === 0 ? (
              <p className="p-8 text-center text-sm font-bold text-slate-400">Your rows will appear here before importing.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Line</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Chapter</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.line} className={row.error ? 'bg-error-50/60' : ''}>
                      <td className="px-3 py-2 font-bold text-slate-500">{row.line}</td>
                      <td className="max-w-[12rem] truncate px-3 py-2 font-bold text-slate-800">{row.email}</td>
                      <td className="px-3 py-2 font-bold text-slate-700">{row.chapter_no ?? '--'}</td>
                      <td className="px-3 py-2 font-bold text-slate-700">{row.score ?? '--'}</td>
                      <td className="px-3 py-2">
                        {row.error ? (
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-error-700">
                            <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> {row.error}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-success-700">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {message && (
            <p
              role={message.tone === 'error' ? 'alert' : 'status'}
              className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${message.tone === 'error' ? 'bg-error-50 text-error-800' : 'bg-success-50 text-success-800'}`}
            >
              {message.text}
            </p>
          )}

          <button
            type="button"
            onClick={handleImport}
            disabled={validRows.length === 0 || importing}
            className="press-button mt-5 w-full bg-success-600 text-white shadow-press-success hover:bg-success-700 active:translate-y-1 active:shadow-none"
          >
            {importing ? 'Importing...' : `Import ${validRows.length} valid row${validRows.length === 1 ? '' : 's'}`}
          </button>
        </section>
      </div>
    </div>
  );
}
