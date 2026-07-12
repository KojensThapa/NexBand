"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminSpeakingMockTest } from "@/types/admin";
import {
  ADMIN_SPEAKING_CHANGED_EVENT,
  ADMIN_SPEAKING_KEY,
  getAdminSpeakingTests,
} from "@/lib/admin/speaking-storage";

export function useAdminSpeakingTests() {
  const [tests, setTests] = useState<AdminSpeakingMockTest[]>([]);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setTests(getAdminSpeakingTests());
    setVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    refresh();

    const handleChange = () => refresh();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === ADMIN_SPEAKING_KEY) {
        refresh();
      }
    };

    window.addEventListener(ADMIN_SPEAKING_CHANGED_EVENT, handleChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(ADMIN_SPEAKING_CHANGED_EVENT, handleChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refresh]);

  return { tests, version, refresh };
}
