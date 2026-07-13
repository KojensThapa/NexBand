"use client";

import { useEffect, useState } from "react";
import { ReadingSession } from "@/components/test/reading/reading-session";
import { getReadingMockTest } from "@/lib/exams/ielts-reading";
import { getAdminReadingTaskById } from "@/lib/admin/reading-to-exam";
import { getAdminReadingTests } from "@/lib/admin/reading-storage";
import type { ReadingMockTest } from "@/types/reading";

interface ReadingTaskPageClientProps {
  taskId: string;
  backHref?: string;
}

type ResolvedSession =
  | { kind: "mock"; mockTest: ReadingMockTest }
  | { kind: "not-found" };

export function ReadingTaskPageClient({
  taskId,
  backHref = "/test/ielts/reading",
}: ReadingTaskPageClientProps) {
  const [resolved, setResolved] = useState<ResolvedSession | null>(null);

  useEffect(() => {
    const adminTests = getAdminReadingTests();
    const adminTask = getAdminReadingTaskById(adminTests, taskId, {
      publishedOnly: true,
    });

    if (adminTask) {
      setResolved({ kind: "mock", mockTest: adminTask });
      return;
    }

    const mockTest = getReadingMockTest(taskId);
    if (mockTest.id === taskId) {
      setResolved({ kind: "mock", mockTest });
      return;
    }

    setResolved({ kind: "not-found" });
  }, [taskId]);

  if (!resolved) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Loading reading test…
      </div>
    );
  }

  if (resolved.kind === "not-found") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-medium text-slate-900">Reading test not found</p>
        <p className="text-sm text-slate-500">
          This test may have been removed or is not published yet.
        </p>
      </div>
    );
  }

  return <ReadingSession mockTest={resolved.mockTest} backHref={backHref} />;
}
