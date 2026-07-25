"use client";

import { useEffect, useState } from "react";
import { WritingSession } from "@/components/test/writing/writing-session";
import { getPublishedWritingTest } from "@/services/writing";
import type { WritingMockTest, WritingTask } from "@/types/writing";

type WritingMode = "mock" | "task-1" | "task-2";

interface WritingTaskPageClientProps {
  mode: WritingMode;
  taskId: string;
}

export function WritingTaskPageClient({ mode, taskId }: WritingTaskPageClientProps) {
  const [resolved, setResolved] = useState<
    | { kind: "mock"; mockTest: WritingMockTest }
    | { kind: "single"; task: WritingTask }
    | { kind: "not-found" }
    | null
  >(null);

  useEffect(() => {
    let active = true;
    setResolved(null);

    void getPublishedWritingTest(taskId)
      .then((test) => {
        if (!active) return;

        if (mode === "mock") {
          setResolved(test.category === "mock" ? { kind: "mock", mockTest: test } : { kind: "not-found" });
          return;
        }

        const taskNumber = mode === "task-1" ? 1 : 2;
        const task = test.tasks.find((candidate) => candidate.taskNumber === taskNumber);
        setResolved(task ? { kind: "single", task } : { kind: "not-found" });
      })
      .catch(() => {
        if (active) setResolved({ kind: "not-found" });
      });

    return () => {
      active = false;
    };
  }, [mode, taskId]);

  if (!resolved) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Loading writing task…
      </div>
    );
  }

  if (resolved.kind === "not-found") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-medium text-slate-900">Task not found</p>
        <p className="text-sm text-slate-500">This writing task may have been removed or is not published yet.</p>
      </div>
    );
  }

  if (resolved.kind === "mock") {
    return (
      <WritingSession mockTest={resolved.mockTest} mode="mock" backHref="/test/ielts/writing" />
    );
  }

  return (
    <WritingSession singleTask={resolved.task} mode={mode} backHref="/test/ielts/writing" />
  );
}
