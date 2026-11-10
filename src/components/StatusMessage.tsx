import { AlertTriangle, Loader2 } from 'lucide-react';

type StatusMessageProps = {
  variant: 'loading' | 'error';
  message: string;
  onRetry?: () => void;
};

export default function StatusMessage({ variant, message, onRetry }: StatusMessageProps) {
  if (variant === 'loading') {
    return (
      <div role="status" className="card flex items-center justify-center gap-3 px-6 py-16 text-sm font-bold text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin text-primary-600" aria-hidden="true" />
        {message}
      </div>
    );
  }
  return (
    <div role="alert" className="card flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error-100 text-error-700">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="max-w-sm text-sm font-bold text-slate-700">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="press-button bg-primary-600 text-white shadow-press-primary hover:bg-primary-700 active:translate-y-1 active:shadow-none">
          Try again
        </button>
      )}
    </div>
  );
}
