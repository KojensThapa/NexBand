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
  clearAdminAuthStorage,
  getStoredAdminSession,
  persistAdminSession,
} from "@/lib/admin/auth/local-admin-auth";
import { clearAdminSessionCookie } from "@/lib/admin/auth/session";
import type { Admin } from "@/types/admin";

interface AdminAuthContextValue {
  admin: Admin | null;
  isLoading: boolean;
  setAdmin: (admin: Admin | null) => void;
  signOut: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdminState] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAdminState(getStoredAdminSession());
    setIsLoading(false);
  }, []);

  const setAdmin = useCallback((nextAdmin: Admin | null) => {
    setAdminState(nextAdmin);
    persistAdminSession(nextAdmin);
  }, []);

  const signOut = useCallback(() => {
    setAdminState(null);
    clearAdminAuthStorage();
    clearAdminSessionCookie();
  }, []);

  const value = useMemo(
    () => ({ admin, isLoading, setAdmin, signOut }),
    [admin, isLoading, setAdmin, signOut]
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
