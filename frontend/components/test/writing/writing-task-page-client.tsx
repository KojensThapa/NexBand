"use client";

import { useEffect, useState } from "react";
import { WritingSession } from "@/components/test/writing/writing-session";
import {
  getWritingMockTest,
  getWritingPracticeTask,
} from "@/lib/exams/ielts-writing";
import {
  buildAdminMockTests,
  getAdminPracticeTasks,
} from "@/lib/admin/writing-to-exam";
import { getAdminWritingQuestions } from "@/lib/admin/writing-storage";
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
    if (taskId.startsWith("admin-writing-") || taskId.startsWith("mock-")) {
      const questions = getAdminWritingQuestions();

      if (mode === "mock") {
        const adminMocks = buildAdminMockTests(questions, { publishedOnly: true });
        const mockTest = adminMocks.find((test) => test.id === taskId);
        if (mockTest) {
          setResolved({ kind: "mock", mockTest });
          return;
        }
      }

      const adminTasks = getAdminPracticeTasks(questions, mode === "task-1" ? 1 : 2, {
        publishedOnly: true,
      });
      const adminTask = adminTasks.find((task) => task.id === taskId);
      if (adminTask) {
        setResolved({ kind: "single", task: adminTask });
        return;
      }
    }

    if (mode === "mock") {
      const mockTest = getWritingMockTest(taskId);
      if (mockTest.id === taskId) {
        setResolved({ kind: "mock", mockTest });
        return;
      }
    }

    const task = getWritingPracticeTask(taskId);
    if (task) {
      if (mode === "task-1" && task.taskNumber !== 1) {
        setResolved({ kind: "not-found" });
        return;
      }
      if (mode === "task-2" && task.taskNumber !== 2) {
        setResolved({ kind: "not-found" });
        return;
      }
      setResolved({ kind: "single", task });
      return;
    }

    setResolved({ kind: "not-found" });
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
