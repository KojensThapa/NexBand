"use client";

import { useMemo, useState } from "react";
import { useTimer } from "@/hooks/useTimer";
import { cn } from "@/lib/utils";
import { countWords } from "@/lib/exams/ielts-writing";
import { getWritingMockTest } from "@/lib/exams/ielts-writing";
import type { WritingMockTest, WritingTaskAnswer } from "@/types/writing";

type WritingMode = "mock" | "task-1" | "task-2";

export function WritingPractice() {
  const [mode, setMode] = useState<WritingMode>("mock");
  const mockTest = getWritingMockTest();

  // Filter tasks based on mode
  const visibleTasks = useMemo(() => {
    if (mode === "task-1") return mockTest.tasks.filter((t) => t.taskNumber === 1);
    if (mode === "task-2") return mockTest.tasks.filter((t) => t.taskNumber === 2);
    return mockTest.tasks; // mock: show all
  }, [mockTest.tasks, mode]);

  const [activeTaskId, setActiveTaskId] = useState<string>(
    () => visibleTasks[0]?.id ?? mockTest.tasks[0]?.id ?? ""
  );
  const [texts, setTexts] = useState<Record<string, string>>(() =>
    Object.fromEntries(mockTest.tasks.map((task) => [task.id, ""]))
  );

  // Adjust timer based on mode
  const timerSeconds = useMemo(() => {
    if (mode === "task-1") return 20 * 60;
    if (mode === "task-2") return 40 * 60;
    return mockTest.totalMinutes * 60;
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
    const tasksToSubmit = mode === "mock" ? mockTest.tasks : visibleTasks;
    const answers: WritingTaskAnswer[] = tasksToSubmit.map((task) => {
      const text = texts[task.id] ?? "";
      return { taskId: task.id, text, wordCount: countWords(text) };
    });
    console.log("Submit:", answers);
    // TODO: send to API
  };

  const modes = [
    { value: "mock", label: "Mock Test", time: "60 min" },
    { value: "task-1", label: "Task 1", time: "20 min" },
    { value: "task-2", label: "Task 2", time: "40 min" },
  ] as const;

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">IELTS Writing Practice</h1>
            <p className="mt-1 text-sm text-slate-600">
              Practice mode: {modes.find((m) => m.value === mode)?.label}
            </p>
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-3 rounded-full border px-4 py-2 font-mono text-lg font-semibold",
              isFinished
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-slate-200 bg-white text-slate-900"
            )}
          >
            {formatted}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Question / Mode Selector */}
        <div className="w-1/2 border-r border-slate-200 bg-white p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Mode Selector */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Practice Mode</h2>
              <div className="space-y-2">
                {modes.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => {
                      setMode(m.value);
                      setActiveTaskId(
                        mockTest.tasks.find((t) => {
                          if (m.value === "task-1") return t.taskNumber === 1;
                          if (m.value === "task-2") return t.taskNumber === 2;
                          return true;
                        })?.id ??
                          mockTest.tasks[0]?.id ??
                          ""
                      );
                    }}
                    className={cn(
                      "w-full rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-all",
                      mode === m.value
                        ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="font-semibold">{m.label}</div>
                    <div className="text-xs text-slate-500">~{m.time}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Task Tabs (only in mock mode) */}
            {mode === "mock" && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-slate-700">Tasks</h2>
                <div className="flex gap-2">
                  {visibleTasks.map((task) => {
                    const isActive = task.id === activeTask.id;
                    const done = countWords(texts[task.id] ?? "") >= task.minWords;
                    return (
                      <button
                        key={task.id}
                        onClick={() => setActiveTaskId(task.id)}
                        className={cn(
                          "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        )}
                      >
                        {task.label}
                        {done && <span className="ml-1">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Question Card */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-start justify-between">
                <h3 className="font-semibold text-slate-900">{activeTask.title}</h3>
                <span className="whitespace-nowrap rounded-full bg-white px-2 py-1 text-xs font-medium text-indigo-600">
                  {activeTask.minWords} words min
                </span>
              </div>

              {activeTask.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeTask.imageUrl}
                  alt={activeTask.imageAlt ?? activeTask.title}
                  className="mb-4 w-full rounded-lg border border-slate-200"
                />
              ) : activeTask.taskNumber === 1 ? (
                <div className="mb-4 flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-400">
                  Chart/Diagram will appear here
                </div>
              ) : null}

              <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                {activeTask.prompt.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex gap-2">
              {!isRunning ? (
                <button
                  onClick={start}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  Start Timer
                </button>
              ) : (
                <button
                  onClick={pause}
                  className="flex-1 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-500"
                >
                  Pause
                </button>
              )}
              <button
                onClick={() => reset()}
                className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Response Editor */}
        <div className="w-1/2 bg-white p-6 flex flex-col overflow-y-auto">
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-slate-700">Your Response</h2>
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
            </div>

            <textarea
              value={activeText}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Start typing your response here..."
              className="flex-1 resize-none rounded-lg border border-slate-200 p-4 text-sm leading-relaxed text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />

            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <p>
                <strong>Tip:</strong> Aim for at least {activeTask.minWords} words. Focus on
                clear structure and natural language.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="mt-4 w-full rounded-lg bg-indigo-600 px-6 py-3 text-center font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            disabled={!meetsMinimum}
          >
            Submit for AI Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
