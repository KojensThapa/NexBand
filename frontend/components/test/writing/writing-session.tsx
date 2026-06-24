"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useTimer } from "@/hooks/useTimer";
import { cn } from "@/lib/utils";
import { countWords } from "@/lib/exams/ielts-writing";
import type { WritingMockTest, WritingTask, WritingTaskAnswer } from "@/types/writing";

type WritingMode = "mock" | "task-1" | "task-2";

interface WritingSessionProps {
  mockTest?: WritingMockTest;
  singleTask?: WritingTask;
  mode: WritingMode;
  backHref?: string;
  onSubmit?: (answers: WritingTaskAnswer[]) => void;
}

export function WritingSession({
  mockTest,
  singleTask,
  mode,
  backHref = "/test/ielts/writing",
  onSubmit,
}: WritingSessionProps) {
  const searchParams = useSearchParams();
  const resolvedBackHref = searchParams.get("back") ?? backHref;

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
  const meetsMinimum = activeTask ? wordCount >= activeTask.minWords : false;

  const handleChange = (value: string) => {
    if (!activeTask) return;
    setTexts((prev) => ({ ...prev, [activeTask.id]: value }));
  };

  const handleSubmit = () => {
    const answers: WritingTaskAnswer[] = visibleTasks.map((task) => {
      const text = texts[task.id] ?? "";
      return { taskId: task.id, text, wordCount: countWords(text) };
    });
    onSubmit?.(answers);
  };

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
              <div className="hidden gap-2 sm:flex">
                {visibleTasks.map((task) => {
                  const isActive = task.id === activeTask.id;
                  const done = countWords(texts[task.id] ?? "") >= task.minWords;
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
                meetsMinimum ? "text-emerald-600" : "text-slate-400"
              )}
            >
              {wordCount} words
              {!meetsMinimum && ` · ${activeTask.minWords - wordCount} more`}
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
          </p>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!meetsMinimum}
            className="mt-4 w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit for AI feedback
          </button>
        </section>
      </div>
    </div>
  );
}
