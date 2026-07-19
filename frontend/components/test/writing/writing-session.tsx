"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnalysisLoader } from "@/components/reports/analysis-loader";
import { SubmitTestButton } from "@/components/test/submit-test-button";
import { useTimer } from "@/hooks/useTimer";
import {
  analyzeWritingSubmission,
  createSavedReport,
} from "@/lib/reports/mock-analysis";
import { saveReport } from "@/lib/reports/storage";
import { cn } from "@/lib/utils";
import { countWords } from "@/lib/exams/ielts-writing";
import {
  saveWritingDraft,
  startWritingAttempt,
  submitWritingAttempt,
} from "@/services/writing";
import type { WritingMockTest, WritingTask } from "@/types/writing";

type WritingMode = "mock" | "task-1" | "task-2";

/** Minimum words required before the submit button is enabled for AI feedback. */
const SUBMIT_MIN_WORDS = 50;

function getSubmitMinimum(task: WritingTask) {
  return Math.min(task.minWords, SUBMIT_MIN_WORDS);
}

interface WritingSessionProps {
  mockTest?: WritingMockTest;
  singleTask?: WritingTask;
  mode: WritingMode;
  backHref?: string;
}

export function WritingSession({
  mockTest,
  singleTask,
  mode,
  backHref = "/test/ielts/writing",
}: WritingSessionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedBackHref = searchParams.get("back") ?? backHref;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const visibleTasks = useMemo(() => {
    if (singleTask) return [singleTask];
    if (!mockTest) return [];
    if (mode === "task-1") return mockTest.tasks.filter((t) => t.taskNumber === 1);
    if (mode === "task-2") return mockTest.tasks.filter((t) => t.taskNumber === 2);
    return mockTest.tasks;
  }, [mockTest, singleTask, mode]);

  const [activeTaskId, setActiveTaskId] = useState(visibleTasks[0]?.id ?? "");
  const [texts, setTexts] = useState<Record<string, string>>(() =>
    Object.fromEntries(visibleTasks.map((task) => [task.id, ""]))
  );

  const backendTestId = mockTest?.isBackendTest
    ? mockTest.id
    : singleTask?.isBackendTest
      ? singleTask.testId
      : undefined;
  const isBackendTest = Boolean(backendTestId);

  const timerSeconds = useMemo(() => {
    if (singleTask) return singleTask.recommendedMinutes * 60;
    if (mode === "task-1") return 20 * 60;
    if (mode === "task-2") return 40 * 60;
    return mockTest?.totalMinutes ? mockTest.totalMinutes * 60 : 60 * 60;
  }, [singleTask, mode, mockTest?.totalMinutes]);

  const { formatted, isRunning, isFinished, start, pause, reset } = useTimer(
    timerSeconds,
    { autoStart: true }
  );

  const activeTask =
    visibleTasks.find((task) => task.id === activeTaskId) ?? visibleTasks[0];

  const activeText = activeTask ? texts[activeTask.id] ?? "" : "";
  const wordCount = useMemo(() => countWords(activeText), [activeText]);
  const submitMinimum = activeTask ? getSubmitMinimum(activeTask) : 0;
  const canSubmit = activeTask ? wordCount >= submitMinimum : false;
  const meetsRecommended = activeTask ? wordCount >= activeTask.minWords : false;

  const draftEssays = useMemo(
    () =>
      visibleTasks
        .map((task) => ({ taskId: task.id, content: texts[task.id] ?? "" }))
        .filter((essay) => essay.content.length > 0),
    [texts, visibleTasks]
  );

  useEffect(() => {
    if (!backendTestId) return;

    let active = true;
    void startWritingAttempt(backendTestId)
      .then(({ attempt }) => {
        if (active) {
          setAttemptId(attempt.id);
          setAttemptError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setAttemptError(
            error instanceof Error
              ? error.message
              : "Could not start the writing attempt."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [backendTestId]);

  useEffect(() => {
    if (!attemptId || !isBackendTest || draftEssays.length === 0 || submissionMessage) return;

    const timeout = window.setTimeout(() => {
      setDraftStatus("Saving draft…");
      void saveWritingDraft(attemptId, draftEssays)
        .then(() => {
          setDraftStatus("Draft saved");
          setAttemptError(null);
        })
        .catch((error: unknown) => {
          setDraftStatus(null);
          setAttemptError(error instanceof Error ? error.message : "Draft could not be saved.");
        });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [attemptId, draftEssays, isBackendTest, submissionMessage]);

  const handleChange = (value: string) => {
    if (!activeTask) return;
    setTexts((prev) => ({ ...prev, [activeTask.id]: value }));
  };

  const handleSubmit = useCallback(async () => {
    if (!activeTask || !canSubmit) return;
    pause();

    if (isBackendTest) {
      if (!attemptId) {
        setAttemptError("Your attempt is not ready yet. Please sign in and wait a moment before submitting.");
        return;
      }

      try {
        const { attempt, alreadySubmitted } = await submitWritingAttempt(attemptId, draftEssays);
        setSubmissionMessage(
          alreadySubmitted
            ? "This essay is already queued for analysis."
            : `Essay stored successfully. Status: ${attempt.status.replaceAll("_", " ")}.`
        );
        setDraftStatus(null);
        setAttemptError(null);
        return;
      } catch (error) {
        setAttemptError(
          error instanceof Error ? error.message : "Your essay could not be submitted."
        );
        return;
      }
    }

    setIsAnalyzing(true);

    const detail = await analyzeWritingSubmission({
      taskTitle: activeTask.title,
      taskPrompt: activeTask.prompt,
      responseText: activeText,
      wordCount,
    });

    const report = createSavedReport(
      "writing",
      mockTest
        ? `${mockTest.title} — ${activeTask.label}`
        : singleTask
          ? `IELTS ${activeTask.label} — ${activeTask.title}`
          : activeTask.title,
      activeText.slice(0, 80) + (activeText.length > 80 ? "…" : ""),
      detail.overallScore,
      detail
    );

    saveReport(report);
    router.push(`/report/${report.id}`);
  }, [
    activeTask,
    activeText,
    attemptId,
    canSubmit,
    draftEssays,
    isBackendTest,
    mockTest,
    pause,
    router,
    singleTask,
    wordCount,
  ]);

  const sessionTitle = singleTask
    ? singleTask.title
    : mockTest?.title ?? "Writing Practice";

  if (!activeTask) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-slate-500">No writing task found.</p>
      </div>
    );
  }

  return (
    <>
      {isAnalyzing ? <AnalysisLoader message="Analyzing your writing with AI…" /> : null}
      <div className="flex h-full min-h-0 flex-col bg-slate-100">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={resolvedBackHref}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              ← Back to tasks
            </Link>
            <h1 className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl">
              {sessionTitle}
            </h1>
            {singleTask?.typeLabel ? (
              <p className="text-sm text-slate-500">{singleTask.typeLabel}</p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {visibleTasks.length > 1 ? (
              <div className="flex gap-2">
                {visibleTasks.map((task) => {
                  const isActive = task.id === activeTask.id;
                  const done = countWords(texts[task.id] ?? "") >= getSubmitMinimum(task);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setActiveTaskId(task.id)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {task.label}
                      {done ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-sm font-semibold sm:px-4 sm:py-2 sm:text-base",
                isFinished
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : "border-slate-200 bg-white text-slate-900"
              )}
            >
              {formatted}
              {isRunning ? (
                <button
                  type="button"
                  onClick={pause}
                  className="text-xs font-sans font-medium text-indigo-600 hover:underline sm:text-sm"
                >
                  Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={start}
                  className="text-xs font-sans font-medium text-indigo-600 hover:underline sm:text-sm"
                >
                  Resume
                </button>
              )}
              <button
                type="button"
                onClick={() => reset()}
                className="text-xs font-sans font-medium text-slate-400 hover:underline sm:text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      {attemptError ? (
        <div className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-center text-sm text-rose-700">
          {attemptError}
        </div>
      ) : null}
      {submissionMessage ? (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-800">
          {submissionMessage}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <section className="flex w-1/2 flex-col overflow-y-auto border-r border-slate-200 bg-white p-4 sm:p-6">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              {activeTask.title}
            </h2>
            <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
              min {activeTask.minWords} words
            </span>
          </div>

          {activeTask.typeLabel ? (
            <span className="mb-4 inline-flex w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
              {activeTask.typeLabel}
            </span>
          ) : null}

          {activeTask.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeTask.imageUrl}
              alt={activeTask.imageAlt ?? activeTask.title}
              className="mb-4 w-full rounded-xl border border-slate-200"
            />
          ) : activeTask.taskNumber === 1 ? (
            <div className="mb-4 flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-400">
              {activeTask.imageAlt ?? "Chart or diagram will appear here"}
            </div>
          ) : null}

          <div className="space-y-3 text-sm leading-relaxed text-slate-700">
            {activeTask.prompt.split("\n\n").map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section className="flex w-1/2 flex-col overflow-hidden bg-white p-4 sm:p-6">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Your response</h3>
            <span
              className={cn(
                "text-sm font-medium",
                meetsRecommended ? "text-emerald-600" : canSubmit ? "text-amber-600" : "text-slate-400"
              )}
            >
              {wordCount} words
              {!canSubmit && ` · ${submitMinimum - wordCount} more to submit`}
              {canSubmit && !meetsRecommended && ` · ${activeTask.minWords - wordCount} more for target`}
            </span>
          </div>

          <textarea
            value={activeText}
            onChange={(event) => handleChange(event.target.value)}
            placeholder={`Write your ${activeTask.label.toLowerCase()} response here...`}
            className="min-h-0 flex-1 resize-none rounded-xl border border-slate-200 p-4 text-sm leading-relaxed text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />

          <p className="mt-3 text-xs text-slate-500">
            Aim for at least {activeTask.minWords} words within{" "}
            {activeTask.recommendedMinutes} minutes.
            {isBackendTest && draftStatus ? ` ${draftStatus}.` : ""}
          </p>

          <SubmitTestButton
            label={isBackendTest ? "Submit essay" : undefined}
            onClick={handleSubmit}
            disabled={!canSubmit || Boolean(submissionMessage)}
            className="mt-4"
          />
        </section>
      </div>
    </div>
    </>
  );
}
