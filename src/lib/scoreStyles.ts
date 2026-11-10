export type ScoreStyle = {
  text: string;
  bg: string;
  bar: string;
  ring: string;
};

const EMPTY_STYLE: ScoreStyle = {
  text: 'text-slate-400',
  bg: 'bg-slate-100',
  bar: 'bg-slate-300',
  ring: 'ring-slate-200',
};

export function scoreStyle(score: number | null): ScoreStyle {
  if (score === null) return EMPTY_STYLE;
  if (score >= 80) {
    return { text: 'text-success-700', bg: 'bg-success-50', bar: 'bg-success-500', ring: 'ring-success-200' };
  }
  if (score >= 60) {
    return { text: 'text-primary-700', bg: 'bg-primary-50', bar: 'bg-primary-500', ring: 'ring-primary-200' };
  }
  return { text: 'text-error-700', bg: 'bg-error-50', bar: 'bg-error-500', ring: 'ring-error-200' };
}

export function formatScore(score: number | null): string {
  if (score === null) return '--';
  return `${Math.round(score)}%`;
}

export function formatSigned(value: number | null): string {
  if (value === null) return '--';
  if (value === 0) return '0%';
  return `${value > 0 ? '+' : ''}${value}%`;
}
