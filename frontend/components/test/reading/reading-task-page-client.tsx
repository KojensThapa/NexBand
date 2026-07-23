"use client";

import { useEffect, useState } from "react";
import { ReadingSession } from "@/components/test/reading/reading-session";
import { getPublishedReadingTest } from "@/services/reading";
import type { ReadingMockTest } from "@/types/reading";

interface ReadingTaskPageClientProps {
  taskId: string;
  backHref?: string;
}

export function ReadingTaskPageClient({
  taskId,
  backHref = "/test/ielts/reading",
}: ReadingTaskPageClientProps) {
  const [mockTest, setMockTest] = useState<ReadingMockTest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getPublishedReadingTest(taskId)
      .then((test) => {
        if (active) {
          setMockTest(test);
          setError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error ? requestError.message : "Reading test not found."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [taskId]);

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-medium text-slate-900">Reading test not found</p>
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  if (!mockTest) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Loading Reading test…
      </div>
    );
  }

  return <ReadingSession mockTest={mockTest} backHref={backHref} />;
}
