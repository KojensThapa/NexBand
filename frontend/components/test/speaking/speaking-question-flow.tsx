"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { useTimer } from "@/hooks/useTimer";
import type { SpeakingQuestion } from "@/types/speaking";
import { SpeakingRecorder } from "./speaking-recorder";

interface SpeakingQuestionFlowProps {
  questions: SpeakingQuestion[];
  /** Optional overall timer (seconds) for this section, shown top-right. */
  sectionSeconds?: number;
  /** Title for the section, e.g. "Part 1 — Introduction & Interview". */
  sectionTitle: string;
  /** Short helper label shown under the title. */
  sectionHint?: string;
  /** Label on the finish button. */
  finishLabel?: string;
  /** Called with the set of question ids the candidate recorded. */
  onComplete: (recordedIds: string[]) => void;
  /** Allow the section timer to auto-run. */
  autoStartTimer?: boolean;
}

/**
 * Shows one speaking question at a time with a progress indicator (Question x/N),
 * the recorder, and Previous / Next / Finish controls. Used by Part 1 and Part 3.
 */
export function SpeakingQuestionFlow({
  questions,
  sectionSeconds,
  sectionTitle,
  sectionHint,
  finishLabel = "Finish section",
  onComplete,
  autoStartTimer = true,
}: SpeakingQuestionFlowProps) {
  const [index, setIndex] = useState(0);
  const [recorded, setRecorded] = useState<Set<string>>(new Set());

  const hasTimer = typeof sectionSeconds === "number";
  const { formatted, isRunning, isFinished, start, pause } = useTimer(
    hasTimer ? (sectionSeconds as number) : 0,
    { autoStart: autoStartTimer && hasTimer }
  );

  const current = questions[index];
  const total = questions.length;
  const isLast = index === total - 1;
  const progressPercent = total ? ((index + 1) / total) * 100 : 0;

  const handleRecorded = useCallback(() => {
    setRecorded((prev) => {
      const next = new Set(prev);
      next.add(current.id);
      return next;
    });
  }, [current.id]);

  const handleNext = () => {
    if (!isLast) setIndex((i) => i + 1);
    else onComplete(Array.from(recorded));
  };

  return (
    <div className="space-y-5">
      {/* Section header + timer */}
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">{sectionTitle}</h2>
            {sectionHint ? (
              <p className="mt-1 text-sm text-slate-500">{sectionHint}</p>
            ) : null}
          </div>
          {hasTimer ? (
            <div
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 font-mono text-sm font-semibold",
                isFinished
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : "border-slate-200 bg-white text-slate-900"
              )}
            >
              <span className="text-xs font-sans font-medium text-slate-400">Remaining</span>
              {formatted}
              {hasTimer && !isFinished ? (
                <button
                  type="button"
                  onClick={isRunning ? pause : start}
                  className="text-xs font-sans font-medium text-indigo-600 hover:underline"
                >
                  {isRunning ? "Pause" : "Resume"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>
              Question {index + 1} of {total}
            </span>
            <span>
              {recorded.size}/{total} recorded
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Question + recorder */}
      <article key={current.id} className="nb-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
            {index + 1}
          </span>
          <h3 className="pt-1 text-base font-semibold leading-relaxed text-slate-900 sm:text-lg">
            {current.text}
          </h3>
        </div>

        <div className="mt-5">
          <SpeakingRecorder onComplete={() => handleRecorded()} />
        </div>
      </article>

      {/* Navigation */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Previous
        </button>

        <div className="hidden gap-1.5 sm:flex">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              aria-label={`Go to question ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2.5 rounded-full transition-all",
                i === index
                  ? "w-6 bg-indigo-600"
                  : recorded.has(q.id)
                    ? "w-2.5 bg-emerald-400"
                    : "w-2.5 bg-slate-300 hover:bg-slate-400"
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center rounded-lg bg-[#553285] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#432668]"
        >
          {isLast ? finishLabel : "Next question"}
          {!isLast ? " →" : ""}
        </button>
      </div>
    </div>
  );
}
