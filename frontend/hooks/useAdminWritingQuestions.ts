"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminWritingQuestion } from "@/types/admin";
import { getAdminWritingQuestions } from "@/services/writing-admin";

export function useAdminWritingQuestions() {
  const [questions, setQuestions] = useState<AdminWritingQuestion[]>([]);
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await getAdminWritingQuestions();
      setQuestions(next);
    } finally {
      setVersion((current) => current + 1);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { questions, version, isLoading, refresh };
}
