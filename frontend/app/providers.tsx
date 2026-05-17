"use client";

import { AuthProvider } from "@/context/AuthContext";
import { TestProvider } from "@/context/TestContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TestProvider>{children}</TestProvider>
    </AuthProvider>
  );
}
