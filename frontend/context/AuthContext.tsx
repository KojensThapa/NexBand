"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearUserSession,
  getStoredSessionUser,
  persistSessionUser,
} from "@/lib/auth/client-session";
import { clearSessionCookie } from "@/lib/auth/session";
import { getCurrentUser, signOutApiUser } from "@/services/auth";
import type { User } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedUser = getStoredSessionUser();
      if (isMounted) setUserState(storedUser);

      const currentUser = await getCurrentUser();
      if (!isMounted) return;

      if (currentUser) {
        setUserState(currentUser);
        persistSessionUser(currentUser);
      } else {
        setUserState(null);
        clearUserSession();
        clearSessionCookie();
      }

      setIsLoading(false);
    }

    void restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const setUser = useCallback((nextUser: User | null) => {
    setUserState(nextUser);
    persistSessionUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    setUserState(null);
    clearUserSession();
    clearSessionCookie();
    signOutApiUser();
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, setUser, signOut }),
    [user, isLoading, setUser, signOut]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}
