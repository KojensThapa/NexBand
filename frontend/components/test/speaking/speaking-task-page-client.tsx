"use client";

import { useEffect, useState } from "react";
import { SpeakingSession } from "@/components/test/speaking/speaking-session";
import {
  getSpeakingMockTest,
  getSpeakingPart1Task,
  getSpeakingPart2Task,
  getSpeakingPart3Task,
} from "@/lib/exams/ielts-speaking";
import { getAdminSpeakingTaskById } from "@/lib/admin/speaking-to-exam";
import { getAdminSpeakingTests } from "@/lib/admin/speaking-storage";
import type {
  SpeakingBoardMode,
  SpeakingMockTest,
  SpeakingPart1Task,
  SpeakingPart2Task,
  SpeakingPart3Task,
} from "@/types/speaking";

interface SpeakingTaskPageClientProps {
  mode: SpeakingBoardMode;
  testId: string;
  backHref?: string;
}

type ResolvedSession =
  | { kind: "mock"; mockTest: SpeakingMockTest }
  | { kind: "part-1"; part1Task: SpeakingPart1Task }
  | { kind: "part-2"; part2Task: SpeakingPart2Task }
  | { kind: "part-3"; part3Task: SpeakingPart3Task }
  | { kind: "not-found" };

export function SpeakingTaskPageClient({
  mode,
  testId,
  backHref = "/test/ielts/speaking",
}: SpeakingTaskPageClientProps) {
  const [resolved, setResolved] = useState<ResolvedSession | null>(null);

  useEffect(() => {
    if (testId.startsWith("admin-speaking-")) {
      const adminTests = getAdminSpeakingTests();
      const task = getAdminSpeakingTaskById(adminTests, mode, testId, {
        publishedOnly: true,
      });

      if (task) {
        if (mode === "mock") {
          setResolved({ kind: "mock", mockTest: task as SpeakingMockTest });
          return;
        }
        if (mode === "part-1") {
          setResolved({ kind: "part-1", part1Task: task as SpeakingPart1Task });
          return;
        }
        if (mode === "part-2") {
          setResolved({ kind: "part-2", part2Task: task as SpeakingPart2Task });
          return;
        }
        setResolved({ kind: "part-3", part3Task: task as SpeakingPart3Task });
        return;
      }

      setResolved({ kind: "not-found" });
      return;
    }

    if (mode === "mock") {
      const mockTest = getSpeakingMockTest(testId);
      if (mockTest.id === testId) {
        setResolved({ kind: "mock", mockTest });
        return;
      }
      setResolved({ kind: "not-found" });
      return;
    }

    if (mode === "part-1") {
      const task = getSpeakingPart1Task(testId);
      if (task) {
        setResolved({ kind: "part-1", part1Task: task });
        return;
      }
      setResolved({ kind: "not-found" });
      return;
    }

    if (mode === "part-2") {
      const task = getSpeakingPart2Task(testId);
      if (task) {
        setResolved({ kind: "part-2", part2Task: task });
        return;
      }
      setResolved({ kind: "not-found" });
      return;
    }

    if (mode === "part-3") {
      const task = getSpeakingPart3Task(testId);
      if (task) {
        setResolved({ kind: "part-3", part3Task: task });
        return;
      }
      setResolved({ kind: "not-found" });
      return;
    }

    setResolved({ kind: "not-found" });
  }, [mode, testId]);

  if (!resolved) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Loading speaking test…
      </div>
    );
  }

  if (resolved.kind === "not-found") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-medium text-slate-900">Speaking test not found</p>
        <p className="text-sm text-slate-500">
          This test may have been removed or is not published yet.
        </p>
      </div>
    );
  }

  if (resolved.kind === "mock") {
    return (
      <SpeakingSession mode="mock" mockTest={resolved.mockTest} backHref={backHref} />
    );
  }

  if (resolved.kind === "part-1") {
    return (
      <SpeakingSession mode="part-1" part1Task={resolved.part1Task} backHref={backHref} />
    );
  }

  if (resolved.kind === "part-2") {
    return (
      <SpeakingSession mode="part-2" part2Task={resolved.part2Task} backHref={backHref} />
    );
  }

  return (
    <SpeakingSession mode="part-3" part3Task={resolved.part3Task} backHref={backHref} />
  );
}
