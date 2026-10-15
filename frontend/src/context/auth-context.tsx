import { createContext, type PropsWithChildren, useContext, useMemo, useState } from 'react';

import { hrApi } from '@/services/hr-api';
import type { Employee } from '@/types/hr';

type Session = { token: string; user: Employee } | null;

type AuthContextValue = {
  session: Session;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session>(null);
  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      async signIn(email, password) {
        const result = await hrApi.login(email, password);
        setSession(result);
      },
      signOut() {
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
