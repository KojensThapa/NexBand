"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminListeningMockTest } from "@/types/admin";
import { getAdminListeningTests } from "@/services/listening-admin";

export function useAdminListeningTests() {
  const [tests, setTests] = useState<AdminListeningMockTest[]>([]);
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await getAdminListeningTests();
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
