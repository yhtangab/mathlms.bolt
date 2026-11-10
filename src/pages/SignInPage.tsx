import { useState } from 'react';
import { ArrowRight, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { SCHOOL_EMAIL_DOMAIN } from '@/lib/session';

export default function SignInPage() {
  const { notice, signInWithGoogle } = useSession();
  const [pending, setPending] = useState(false);

  const handleSignIn = async () => {
    setPending(true);
    await signInWithGoogle();
    setPending(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 px-4 py-12">
      <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
        <div className="animate-rise-in text-white">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
            <GraduationCap className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-6 text-sm font-extrabold uppercase tracking-widest text-accent-200">HLC Math</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">Level up every chapter.</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-primary-100">
            Track assessment results, earn daily marks in class and follow your progress through the seven S2 Mathematics chapters.
          </p>
          <ul className="mt-8 space-y-3 text-sm font-bold text-primary-50">
            <li className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-accent-300" aria-hidden="true" /> Daily marks, quizzes and wheel wins in one feed
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-accent-300" aria-hidden="true" /> Only school accounts can sign in
            </li>
          </ul>
        </div>

        <div className="animate-rise-in card p-6 sm:p-8" style={{ animationDelay: '120ms' }}>
          <h2 className="text-2xl font-extrabold text-slate-900">Sign in</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
            Use your school Google account ending in @{SCHOOL_EMAIL_DOMAIN}.
          </p>

          <button
            type="button"
            onClick={() => void handleSignIn()}
            disabled={pending}
            className="press-button mt-6 w-full bg-primary-600 text-white shadow-press-primary hover:bg-primary-700 active:translate-y-1 active:shadow-none"
          >
            {pending ? 'Opening Google...' : 'Sign in with school Google account'}
            {!pending && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>

          {notice && (
            <p role="alert" className="mt-4 rounded-2xl bg-error-50 px-4 py-3 text-sm font-bold text-error-800">
              {notice}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
