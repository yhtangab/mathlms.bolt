import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone: 'primary' | 'success' | 'accent' | 'error';
};

const TONE_CLASSES = {
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-success-100 text-success-700',
  accent: 'bg-accent-100 text-accent-700',
  error: 'bg-error-100 text-error-700',
};

export default function StatCard({ icon: Icon, label, value, hint, tone }: StatCardProps) {
  return (
    <div className="card flex items-start gap-4 p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${TONE_CLASSES[tone]}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-extrabold leading-tight text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs font-semibold text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}
