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
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session";
import {
  forgotPassword as apiForgotPassword,
  getCurrentUser,
  registerVerify as apiRegisterVerify,
  resendOtp as apiResendOtp,
  resetPassword as apiResetPassword,
  signOutApiUser,
} from "@/services/auth";
import type { User } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => void;
  verifyEmail: (email: string, otp: string) => Promise<User>;
  resendOTP: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
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

  const verifyEmail = useCallback(
    async (email: string, otp: string) => {
      const { user: verifiedUser, token } = await apiRegisterVerify({ email, otp });
      setSessionCookie(token);
      setUser(verifiedUser);
      return verifiedUser;
    },
    [setUser]
  );

  const resendOTP = useCallback(async (email: string) => {
    await apiResendOtp(email);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await apiForgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    await apiResetPassword({ token, password });
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, setUser, signOut, verifyEmail, resendOTP, forgotPassword, resetPassword }),
    [user, isLoading, setUser, signOut, verifyEmail, resendOTP, forgotPassword, resetPassword]
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
