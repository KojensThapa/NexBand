"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminWritingQuestion } from "@/types/admin";
import {
  ADMIN_WRITING_CHANGED_EVENT,
  ADMIN_WRITING_KEY,
  getAdminWritingQuestions,
} from "@/lib/admin/writing-storage";

export function useAdminWritingQuestions() {
  const [questions, setQuestions] = useState<AdminWritingQuestion[]>([]);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setQuestions(getAdminWritingQuestions());
    setVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    refresh();

    const handleChange = () => refresh();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === ADMIN_WRITING_KEY) {
        refresh();
      }
    };

    window.addEventListener(ADMIN_WRITING_CHANGED_EVENT, handleChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(ADMIN_WRITING_CHANGED_EVENT, handleChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refresh]);

  return { questions, version, refresh };
}
