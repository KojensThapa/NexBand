"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TestSession } from "@/types/test";

interface TestContextValue {
  session: TestSession | null;
  setSession: (session: TestSession | null) => void;
}

const TestContext = createContext<TestContextValue | undefined>(undefined);

export function TestProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TestSession | null>(null);

  const value = useMemo(() => ({ session, setSession }), [session]);

  return (
    <TestContext.Provider value={value}>{children}</TestContext.Provider>
  );
}

export function useTestContext() {
  const ctx = useContext(TestContext);
  if (!ctx) {
    throw new Error("useTestContext must be used within TestProvider");
  }
  return ctx;
}
