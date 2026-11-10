type AvatarProps = {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'primary' | 'success' | 'accent' | 'secondary';
};

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-20 w-20 text-2xl',
};

const TONE_CLASSES = {
  primary: 'bg-primary-600 text-white',
  success: 'bg-success-600 text-white',
  accent: 'bg-accent-400 text-accent-900',
  secondary: 'bg-secondary-600 text-white',
};

export function initialsOf(name: string): string {
  const parts = name.replace(/^Ms\.\s*|^Mr\.\s*/, '').trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function Avatar({ name, size = 'md', tone = 'primary' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-2xl font-extrabold shadow-sm ${SIZE_CLASSES[size]} ${TONE_CLASSES[tone]}`}
    >
      {initialsOf(name)}
    </span>
  );
}
