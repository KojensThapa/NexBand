"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminListeningMockTest } from "@/types/admin";
import {
  ADMIN_LISTENING_CHANGED_EVENT,
  ADMIN_LISTENING_KEY,
  getAdminListeningTests,
} from "@/lib/admin/listening-storage";

export function useAdminListeningTests() {
  const [tests, setTests] = useState<AdminListeningMockTest[]>([]);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setTests(getAdminListeningTests());
    setVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    refresh();

    const handleChange = () => refresh();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === ADMIN_LISTENING_KEY) {
        refresh();
      }
    };

    window.addEventListener(ADMIN_LISTENING_CHANGED_EVENT, handleChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(ADMIN_LISTENING_CHANGED_EVENT, handleChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refresh]);

  return { tests, version, refresh };
}
