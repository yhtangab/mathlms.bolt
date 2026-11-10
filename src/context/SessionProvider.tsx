import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchMemberByEmail } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { SCHOOL_EMAIL_DOMAIN, isSchoolEmail, normalizeEmail } from '@/lib/session';
import { SessionContext, type SessionStatus, type SessionValue } from '@/context/SessionContext';
import type { Member } from '@/types';

const SCHOOL_ONLY_MESSAGE = `Please sign in with your @${SCHOOL_EMAIL_DOMAIN} school Google account.`;
const NOT_ON_ROSTER_MESSAGE = 'Your school account is not on the class roster. Please ask your teacher to add you.';
const CONNECTION_MESSAGE = 'Could not reach the school directory. Please try again.';
const SIGN_IN_FAILED_MESSAGE = 'Google sign-in could not start. Please try again.';

export default function SessionProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const resolveSession = async (email: string | null | undefined) => {
      if (!email) {
        if (!active) return;
        setMember(null);
        setStatus('signed-out');
        return;
      }

      const normalized = normalizeEmail(email);
      if (!isSchoolEmail(normalized)) {
        await supabase.auth.signOut();
        if (!active) return;
        setNotice(SCHOOL_ONLY_MESSAGE);
        setMember(null);
        setStatus('signed-out');
        return;
      }

      try {
        const found = await fetchMemberByEmail(normalized);
        if (!active) return;
        if (!found) {
          await supabase.auth.signOut();
          if (!active) return;
          setNotice(NOT_ON_ROSTER_MESSAGE);
          setMember(null);
          setStatus('signed-out');
          return;
        }
        setNotice(null);
        setMember(found);
        setStatus('signed-in');
      } catch {
        if (!active) return;
        setNotice(CONNECTION_MESSAGE);
        setMember(null);
        setStatus('signed-out');
      }
    };

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        await resolveSession(session?.user?.email);
      })();
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setNotice(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { hd: SCHOOL_EMAIL_DOMAIN, prompt: 'select_account' },
      },
    });
    if (error) {
      console.error('google sign in', error);
      setNotice(SIGN_IN_FAILED_MESSAGE);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setMember(null);
    setStatus('signed-out');
  }, []);

  const value: SessionValue = useMemo(
    () => ({ status, member, notice, signInWithGoogle, signOut }),
    [status, member, notice, signInWithGoogle, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
