import { formatScore, scoreStyle } from '@/lib/scoreStyles';

type ScoreBadgeProps = {
  score: number | null;
  size?: 'sm' | 'md';
};

export default function ScoreBadge({ score, size = 'sm' }: ScoreBadgeProps) {
  const style = scoreStyle(score);
  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full font-extrabold ring-1 ring-inset ${style.bg} ${style.text} ${style.ring} ${sizeClass}`}>
      {formatScore(score)}
    </span>
  );
}
