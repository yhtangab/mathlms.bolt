import { useState, type FormEvent } from 'react';
import Modal from '@/components/Modal';
import { upsertScores, type ScoreUpsert } from '@/lib/api';
import type { StudentStats } from '@/lib/analytics';

type EditScoresModalProps = {
  entry: StudentStats;
  onClose: () => void;
  onSaved: () => void;
};

export default function EditScoresModal({ entry, onClose, onSaved }: EditScoresModalProps) {
  const [values, setValues] = useState<string[]>(() =>
    entry.scoreByChapter.map((score) => (score === null ? '' : String(score))),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setValue = (index: number, value: string) => {
    setValues((current) => current.map((item, position) => (position === index ? value : item)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const changes: ScoreUpsert[] = [];
    for (let index = 0; index < values.length; index += 1) {
      const raw = values[index].trim();
      const previous = entry.scoreByChapter[index];
      if (raw === '' || Number(raw) === previous) continue;
      const score = Number(raw);
      if (!Number.isFinite(score) || score < 0 || score > 100) {
        setError(`Chapter ${index + 1} must be a number from 0 to 100.`);
        return;
      }
      changes.push({
        student_id: entry.student.id,
        chapter_no: index + 1,
        score,
        prior_score: previous,
      });
    }

    if (changes.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await upsertScores(changes);
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Edit scores: ${entry.student.full_name}`}
      description={`${entry.student.set_code} - changes update the improvement index and rankings.`}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="press-button bg-slate-100 text-slate-700 hover:bg-slate-200">
            Cancel
          </button>
          <button
            type="submit"
            form="edit-scores-form"
            disabled={saving}
            className="press-button bg-primary-600 text-white shadow-press-primary hover:bg-primary-700 active:translate-y-1 active:shadow-none"
          >
            {saving ? 'Saving...' : 'Save scores'}
          </button>
        </>
      }
    >
      <form id="edit-scores-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {values.map((value, index) => (
          <label key={index} className="block">
            <span className="text-xs font-extrabold text-slate-600">Chapter {index + 1} (%)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="1"
              value={value}
              onChange={(event) => setValue(index, event.target.value)}
              placeholder="Not taken"
              className="mt-1.5 w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 placeholder:font-semibold placeholder:text-slate-400 focus:border-primary-500 focus:outline-none"
            />
          </label>
        ))}
        {error && (
          <p role="alert" className="col-span-2 rounded-xl bg-error-50 px-4 py-3 text-sm font-bold text-error-800">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
