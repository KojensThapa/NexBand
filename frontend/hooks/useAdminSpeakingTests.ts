"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminSpeakingMockTest } from "@/types/admin";
import { getAdminSpeakingTests } from "@/services/speaking-admin";

export function useAdminSpeakingTests() {
  const [tests, setTests] = useState<AdminSpeakingMockTest[]>([]);
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await getAdminSpeakingTests();
      setTests(next);
    } finally {
      setVersion((current) => current + 1);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { tests, version, isLoading, refresh };
}
