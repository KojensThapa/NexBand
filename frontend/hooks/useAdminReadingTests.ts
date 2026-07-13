"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminReadingTest } from "@/types/admin";
import {
  ADMIN_READING_CHANGED_EVENT,
  ADMIN_READING_KEY,
  getAdminReadingTests,
} from "@/lib/admin/reading-storage";

export function useAdminReadingTests() {
  const [tests, setTests] = useState<AdminReadingTest[]>([]);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setTests(getAdminReadingTests());
    setVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    refresh();

    const handleChange = () => refresh();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === ADMIN_READING_KEY) {
        refresh();
      }
    };

    window.addEventListener(ADMIN_READING_CHANGED_EVENT, handleChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(ADMIN_READING_CHANGED_EVENT, handleChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refresh]);

  return { tests, version, refresh };
}
