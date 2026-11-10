import { CheckCircle2, Circle, Clock } from 'lucide-react';
import type { ProgressStatus } from '@/types';

const STATUS_STYLE: Record<ProgressStatus, { label: string; className: string; Icon: typeof Circle }> = {
  not_started: { label: 'Not Started', className: 'bg-slate-100 text-slate-600 ring-slate-200', Icon: Circle },
  in_progress: { label: 'In Progress', className: 'bg-accent-100 text-accent-800 ring-accent-200', Icon: Clock },
  completed: { label: 'Completed', className: 'bg-success-100 text-success-800 ring-success-200', Icon: CheckCircle2 },
};

export default function StatusTag({ status }: { status: ProgressStatus }) {
  const { label, className, Icon } = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset ${className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
