import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

export interface Leader {
  id: string;
  communityId: string;
  communityName: string;
  fullName: string;
}

interface AuthContextValue {
  session: Session | null;
  leader: Leader | null;
  isLoading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface LeaderRow {
  id: string;
  community_id: string;
  full_name: string;
  community: { name: string } | null;
}

async function fetchLeader(userId: string): Promise<Leader | null> {
  const { data, error } = await supabase
    .from('leader')
    .select('id, community_id, full_name, community(name)')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as LeaderRow;
  return {
    id: row.id,
    communityId: row.community_id,
    communityName: row.community?.name ?? '',
    fullName: row.full_name,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [leader, setLeader] = useState<Leader | null>(null);
  const [leaderLoading, setLeaderLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });
    // Supabase calls must not be awaited inside this callback; the leader
    // profile is loaded by the effect below instead.
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) {
      setLeader(null);
      return;
    }
    let cancelled = false;
    setLeaderLoading(true);
    fetchLeader(userId)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setAuthError('Esta cuenta no está vinculada a ninguna comunidad.');
          void supabase.auth.signOut();
        }
        setLeader(result);
      })
      .catch((error: unknown) => {
        if (!cancelled) setAuthError(getErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLeaderLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setAuthError(getErrorMessage(error));
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      leader,
      isLoading: !sessionLoaded || leaderLoading,
      authError,
      signIn,
      signOut,
    }),
    [session, leader, sessionLoaded, leaderLoading, authError, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}