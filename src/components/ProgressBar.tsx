import { scoreStyle } from '@/lib/scoreStyles';

type ProgressBarProps = {
  value: number | null;
  label: string;
  height?: 'sm' | 'md';
  tone?: 'auto' | 'primary' | 'success' | 'accent';
};

const TONE_CLASS = {
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  accent: 'bg-accent-400',
};

export default function ProgressBar({ value, label, height = 'md', tone = 'auto' }: ProgressBarProps) {
  const percent = value === null ? 0 : Math.max(0, Math.min(100, value));
  const fill = tone === 'auto' ? scoreStyle(value).bar : TONE_CLASS[tone];
  const heightClass = height === 'sm' ? 'h-2' : 'h-3.5';
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full overflow-hidden rounded-full bg-slate-200/80 ${heightClass}`}
    >
      <div
        className={`animate-fill-bar h-full rounded-full transition-[width] duration-700 ${fill}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
