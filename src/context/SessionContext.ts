import { createContext } from 'react';
import type { Member } from '@/types';

export type SessionStatus = 'loading' | 'signed-out' | 'signed-in';

export type SessionValue = {
  status: SessionStatus;
  member: Member | null;
  notice: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const SessionContext = createContext<SessionValue | null>(null);
