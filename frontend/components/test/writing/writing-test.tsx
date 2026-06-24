"use client";

import { useMemo, useState } from "react";
import { useTimer } from "@/hooks/useTimer";
import { cn } from "@/lib/utils";
import { countWords } from "@/lib/exams/ielts-writing";
import type { WritingMockTest, WritingTaskAnswer } from "@/types/writing";

type WritingMode = "mock" | "task-1" | "task-2";

interface WritingTestProps {
  mockTest: WritingMockTest;
  mode?: WritingMode;
  onSubmit?: (answers: WritingTaskAnswer[]) => void;
}

export function WritingTest({ mockTest, mode = "mock", onSubmit }: WritingTestProps) {
  // Filter tasks based on mode
  const visibleTasks = useMemo(() => {
    if (mode === "task-1") return mockTest.tasks.filter((t) => t.taskNumber === 1);
    if (mode === "task-2") return mockTest.tasks.filter((t) => t.taskNumber === 2);
    return mockTest.tasks; // mock: show all
  }, [mockTest.tasks, mode]);

  const [activeTaskId, setActiveTaskId] = useState(visibleTasks[0]?.id);
  const [texts, setTexts] = useState<Record<string, string>>(() =>
    Object.fromEntries(mockTest.tasks.map((task) => [task.id, ""]))
  );

  // Adjust timer based on mode
  const timerSeconds = useMemo(() => {
    if (mode === "task-1") return 20 * 60; // 20 minutes for task 1
    if (mode === "task-2") return 40 * 60; // 40 minutes for task 2
    return mockTest.totalMinutes * 60; // 60 minutes for mock
  }, [mode, mockTest.totalMinutes]);

  const { formatted, isRunning, isFinished, start, pause, reset } = useTimer(timerSeconds);

  const activeTask =
    visibleTasks.find((task) => task.id === activeTaskId) ?? visibleTasks[0];

  const activeText = texts[activeTask.id] ?? "";
  const wordCount = useMemo(() => countWords(activeText), [activeText]);
  const meetsMinimum = wordCount >= activeTask.minWords;

  const handleChange = (value: string) => {
    setTexts((prev) => ({ ...prev, [activeTask.id]: value }));
  };

  const handleSubmit = () => {
    // For individual task modes, only submit that task's answer
    const tasksToSubmit = mode === "mock" ? mockTest.tasks : visibleTasks;
    const answers: WritingTaskAnswer[] = tasksToSubmit.map((task) => {
      const text = texts[task.id] ?? "";
      return { taskId: task.id, text, wordCount: countWords(text) };
    });
    onSubmit?.(answers);
  };

  return (
    <div className="space-y-4">
      {/* Top bar: task tabs + timer */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {mockTest.title}
          </p>
          <div className="mt-2 flex gap-2">
            {visibleTasks.map((task) => {
              const isActive = task.id === activeTask.id;
              const done = countWords(texts[task.id] ?? "") >= task.minWords;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setActiveTaskId(task.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {task.label}
                  {done && (
                    <span
                      className={cn(
                        "inline-block h-2 w-2 rounded-full",
                        isActive ? "bg-white" : "bg-emerald-500"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={cn(
              "inline-flex items-center gap-3 rounded-full border px-4 py-2 font-mono text-sm",
              isFinished
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-slate-200 bg-white text-slate-900"
            )}
          >
            <span className="font-semibold">{formatted}</span>
            {!isRunning ? (
              <button type="button" onClick={start} className="text-indigo-600 hover:underline">
                Start
              </button>
            ) : (
              <button type="button" onClick={pause} className="text-indigo-600 hover:underline">
                Pause
              </button>
            )}
            <button
              type="button"
              onClick={() => reset()}
              className="text-slate-400 hover:underline"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Card section: prompt (left) + answer (right) */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Prompt card */}
        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{activeTask.title}</h2>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
              ~{activeTask.recommendedMinutes} min · min {activeTask.minWords} words
            </span>
          </header>

          {activeTask.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeTask.imageUrl}
              alt={activeTask.imageAlt ?? activeTask.title}
              className="mt-4 w-full rounded-xl border border-slate-200"
            />
          ) : activeTask.taskNumber === 1 ? (
            <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
              {activeTask.imageAlt ?? "Visual will appear here"}
            </div>
          ) : null}

          <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
            {activeTask.prompt.split("\n\n").map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </article>

        {/* Answer card */}
        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Your response</h3>
            <span
              className={cn(
                "text-xs font-medium",
                meetsMinimum ? "text-emerald-600" : "text-slate-400"
              )}
            >
              {wordCount} {wordCount === 1 ? "word" : "words"}
              {!meetsMinimum && ` · ${activeTask.minWords - wordCount} more to reach minimum`}
            </span>
          </header>

          <textarea
            value={activeText}
            onChange={(event) => handleChange(event.target.value)}
            placeholder={`Write your ${activeTask.label.toLowerCase()} response here...`}
            className="mt-4 min-h-[320px] flex-1 resize-y rounded-xl border border-slate-200 p-4 text-sm leading-relaxed text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Tip: aim for at least {activeTask.minWords} words within{" "}
              {activeTask.recommendedMinutes} minutes.
            </p>
          </div>
        </article>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mr-auto text-xs text-slate-400">
          Both tasks are scored together by AI for an estimated band score.
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Submit for feedback
        </button>
      </div>
    </div>
  );
}
