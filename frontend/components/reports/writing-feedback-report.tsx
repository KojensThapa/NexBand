"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { WritingFeedbackDetail } from "@/types/report";

interface WritingFeedbackReportProps {
  report: WritingFeedbackDetail;
  showTabs?: boolean;
}

const FEEDBACK_TABS = [
  "Task Achievement",
  "Coherence",
  "Vocabulary",
  "Grammar",
] as const;

export function WritingFeedbackReport({
  report,
  showTabs = true,
}: WritingFeedbackReportProps) {
  const [expandedCriterion, setExpandedCriterion] = useState("task-achievement");
  const [feedbackTab, setFeedbackTab] = useState<(typeof FEEDBACK_TABS)[number]>(
    "Coherence"
  );
  const [showVisual, setShowVisual] = useState(false);
  const [viewMode, setViewMode] = useState<"original" | "feedback">("feedback");

  const filteredErrors = report.errors.filter((error) => {
    if (feedbackTab === "Task Achievement") return error.category === "Task Achievement";
    if (feedbackTab === "Vocabulary") return error.category === "Vocabulary";
    if (feedbackTab === "Grammar") return error.category === "Grammar";
    return error.category === "Coherence" || error.category === "Task Achievement";
  });

  return (
    <div className="space-y-6">
      {showTabs ? (
        <div className="flex flex-wrap gap-2">
          {[
            "Academic Writing Task 1",
            "General Writing Task 1",
            "Writing Task 2",
            "IELTS Speaking",
          ].map((tab) => (
            <button
              key={tab}
              type="button"
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                tab === "Academic Writing Task 1"
                  ? "bg-[#553285] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Overall Score</p>
            <p className="text-4xl font-bold text-slate-900">
              {report.overallScore.toFixed(1)}
              <span className="text-xl font-medium text-slate-400">/9.0</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">CEFR Level</p>
            <p className="text-2xl font-bold text-slate-900">{report.cefrLevel}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Word Count</p>
            <p className="text-2xl font-bold text-slate-900">{report.wordCount} Words</p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        {report.criteria.map((criterion) => {
          const isOpen = expandedCriterion === criterion.id;
          return (
            <div
              key={criterion.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedCriterion(isOpen ? "" : criterion.id)
                }
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="flex items-center gap-3">
                  <span className={cn("h-3 w-3 rounded-full", criterion.color)} />
                  <span className="font-medium text-slate-900">{criterion.label}</span>
                </span>
                <span className="font-semibold text-slate-900">
                  {criterion.score.toFixed(1)}
                </span>
              </button>
              {isOpen ? (
                <div className="border-t border-slate-100 px-4 py-4">
                  {criterion.subScores ? (
                    <div className="mb-3 flex flex-wrap gap-4">
                      {criterion.subScores.map((sub) => (
                        <div key={sub.label} className="text-sm">
                          <span className="text-slate-500">{sub.label}</span>
                          <span className="ml-2 font-semibold text-slate-900">
                            {sub.score.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {criterion.summary ? (
                    <p className="text-sm leading-relaxed text-slate-600">
                      {criterion.summary}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Detailed Feedback</h2>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {report.taskTitle}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {report.taskPrompt}
          </p>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showVisual}
            onChange={(event) => setShowVisual(event.target.checked)}
            className="rounded border-slate-300 text-[#553285]"
          />
          Show the task visual
        </label>
        {showVisual ? (
          <div className="mt-3 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
            Task visual will appear here
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {FEEDBACK_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFeedbackTab(tab)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                feedbackTab === tab
                  ? "bg-[#553285] text-white"
                  : "bg-violet-50 text-violet-800 hover:bg-violet-100"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode("original")}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-medium",
                  viewMode === "original"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                Original
              </button>
              <button
                type="button"
                onClick={() => setViewMode("feedback")}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-medium",
                  viewMode === "feedback"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                Feedback
              </button>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Your Writing</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              {viewMode === "feedback"
                ? report.responseText.split(" ").map((word, index) => {
                    const isHighlighted =
                      word.toLowerCase().includes("drop") ||
                      word.toLowerCase().includes("liters");
                    return (
                      <span
                        key={`${word}-${index}`}
                        className={cn(isHighlighted && "bg-sky-100 text-sky-900")}
                      >
                        {word}{" "}
                      </span>
                    );
                  })
                : report.responseText}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              {feedbackTab} Errors
            </h3>
            {(filteredErrors.length ? filteredErrors : report.errors).map((error) => (
              <article
                key={error.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  #{error.id} {error.title}
                </p>
                <p className="mt-2 text-sm text-rose-600 line-through">{error.original}</p>
                <p className="mt-1 text-sm text-emerald-700">{error.corrected}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {error.explanation}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
