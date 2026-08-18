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
  clearAdminSession,
  getStoredAdminSession,
  persistAdminSession,
} from "@/lib/auth/client-session";
import { clearAdminSessionCookie, setAdminSessionCookie } from "@/lib/admin/auth/session";
import {
  forgotPasswordApiAdmin,
  getCurrentAdmin,
  registerVerifyApiAdmin,
  resendOtpApiAdmin,
  resetPassword as apiResetPassword,
  signOutApiUser,
} from "@/services/auth";
import type { Admin } from "@/types/admin";

interface AdminAuthContextValue {
  admin: Admin | null;
  isLoading: boolean;
  setAdmin: (admin: Admin | null) => void;
  signOut: () => void;
  verifyEmail: (email: string, otp: string) => Promise<Admin>;
  resendOTP: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdminState] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedAdmin = getStoredAdminSession();
      if (isMounted) setAdminState(storedAdmin);

      const currentAdmin = await getCurrentAdmin();
      if (!isMounted) return;

      if (currentAdmin) {
        setAdminState(currentAdmin);
        persistAdminSession(currentAdmin);
      } else {
        setAdminState(null);
        clearAdminSession();
        clearAdminSessionCookie();
      }

      setIsLoading(false);
    }

    void restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const setAdmin = useCallback((nextAdmin: Admin | null) => {
    setAdminState(nextAdmin);
    persistAdminSession(nextAdmin);
  }, []);

  const signOut = useCallback(() => {
    setAdminState(null);
    clearAdminSession();
    clearAdminSessionCookie();
    signOutApiUser();
  }, []);

  const verifyEmail = useCallback(
    async (email: string, otp: string) => {
      const { user: verifiedAdmin, token } = await registerVerifyApiAdmin({ email, otp });
      setAdminSessionCookie(token);
      setAdmin(verifiedAdmin);
      return verifiedAdmin;
    },
    [setAdmin]
  );

  const resendOTP = useCallback(async (email: string) => {
    await resendOtpApiAdmin(email);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await forgotPasswordApiAdmin(email);
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    await apiResetPassword({ token, password });
  }, []);

  const value = useMemo(
    () => ({
      admin,
      isLoading,
      setAdmin,
      signOut,
      verifyEmail,
      resendOTP,
      forgotPassword,
      resetPassword,
    }),
    [admin, isLoading, setAdmin, signOut, verifyEmail, resendOTP, forgotPassword, resetPassword]
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuthContext() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuthContext must be used within AdminAuthProvider");
  }
  return ctx;
}
