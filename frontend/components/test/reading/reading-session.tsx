"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AnalysisLoader } from "@/components/reports/analysis-loader";
import { SubmitTestButton } from "@/components/test/submit-test-button";
import { useTimer } from "@/hooks/useTimer";
import {
  analyzeReadingSubmission,
  createSavedReport,
} from "@/lib/reports/mock-analysis";
import { saveReport } from "@/lib/reports/storage";
import { cn } from "@/lib/utils";
import type {
  ReadingMockTest,
  ReadingPassage,
  ReadingQuestion,
} from "@/types/reading";

interface ReadingSessionProps {
  mockTest: ReadingMockTest;
  backHref?: string;
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: ReadingQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  if (question.options?.length) {
    return (
      <div className="mt-2 space-y-2">
        {question.options.map((option, index) => (
          <label
            key={index}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              value === option
                ? "border-indigo-400 bg-indigo-50 text-indigo-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            )}
          >
            <input
              type="radio"
              name={question.id}
              value={option}
              checked={value === option}
              onChange={(event) => onChange(event.target.value)}
              className="text-indigo-600"
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Your answer"
      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
    />
  );
}

export function ReadingSession({
  mockTest,
  backHref = "/test/ielts/reading",
}: ReadingSessionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedBackHref = searchParams.get("back") ?? backHref;
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const visiblePassages = mockTest.passages;

  const allQuestions = useMemo(
    () => visiblePassages.flatMap((passage) => passage.questions),
    [visiblePassages]
  );

  const [activePassageId, setActivePassageId] = useState(
    visiblePassages[0]?.id ?? ""
  );
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(allQuestions.map((question) => [question.id, ""]))
  );

  const timerSeconds = mockTest.totalMinutes * 60;

  const { formatted, isRunning, isFinished, start, pause, reset } = useTimer(
    timerSeconds,
    { autoStart: true }
  );

  const activePassage =
    visiblePassages.find((passage) => passage.id === activePassageId) ??
    visiblePassages[0];

  const answeredCount = useMemo(
    () => allQuestions.filter((question) => answers[question.id]?.trim()).length,
    [allQuestions, answers]
  );

  const sessionTitle = mockTest.title;

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = useCallback(async () => {
    setIsAnalyzing(true);
    pause();

    const detail = await analyzeReadingSubmission({
      taskTitle: sessionTitle,
      answeredCount,
      totalQuestions: allQuestions.length,
    });

    const description =
      allQuestions
        .map((q) => answers[q.id])
        .filter(Boolean)
        .join(", ")
        .slice(0, 80) || "Reading practice submission";

    const report = createSavedReport(
      "reading",
      `IELTS Reading — ${sessionTitle}`,
      description + (description.length >= 80 ? "…" : ""),
      detail.overallScore,
      detail
    );

    saveReport(report);
    router.push(`/report/${report.id}`);
  }, [
    allQuestions,
    answeredCount,
    answers,
    pause,
    router,
    sessionTitle,
  ]);

  if (!activePassage) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-slate-500">No reading passage found.</p>
      </div>
    );
  }

  return (
    <>
      {isAnalyzing ? <AnalysisLoader message="Analyzing your reading answers…" /> : null}
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
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {visiblePassages.length > 1 ? (
              <div className="hidden gap-2 sm:flex">
                {visiblePassages.map((passage) => {
                  const isActive = passage.id === activePassage.id;
                  const partAnswered = passage.questions.filter((question) =>
                    answers[question.id]?.trim()
                  ).length;
                  const partTotal = passage.questions.length;
                  return (
                    <button
                      key={passage.id}
                      type="button"
                      onClick={() => setActivePassageId(passage.id)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {passage.label}
                      {partAnswered === partTotal ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <span className="hidden text-sm text-slate-500 sm:inline">
              {answeredCount}/{allQuestions.length} answered
            </span>

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
              {activePassage.title}
            </h2>
            <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
              {activePassage.label}
            </span>
          </div>

          {activePassage.typeLabel ? (
            <span className="mb-4 inline-flex w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
              {activePassage.typeLabel}
            </span>
          ) : null}

          {activePassage.instruction ? (
            <p className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
              {activePassage.instruction}
            </p>
          ) : null}

          {activePassage.imageUrl ? (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePassage.imageUrl}
                alt={activePassage.imageAlt ?? activePassage.title}
                className="mx-auto block h-auto w-[50%] max-w-full object-contain"
              />
            </div>
          ) : null}

          <div className="space-y-4 text-sm leading-relaxed text-slate-700">
            {activePassage.passage.includes("<") ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: activePassage.passage }}
              />
            ) : (
              activePassage.passage.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))
            )}
          </div>
        </section>

        <section className="flex w-1/2 flex-col overflow-y-auto bg-white p-4 sm:p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Questions</h3>
            <span className="text-sm text-slate-400">
              {activePassage.questions.length} questions
            </span>
          </div>

          <div className="space-y-5">
            {activePassage.questions.map((question) => (
              <article
                key={question.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-medium text-slate-900">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                    {question.number}
                  </span>
                  {question.prompt}
                </p>
                <QuestionInput
                  question={question}
                  value={answers[question.id] ?? ""}
                  onChange={(value) => handleAnswerChange(question.id, value)}
                />
              </article>
            ))}
          </div>

          <SubmitTestButton onClick={handleSubmit} className="mt-6" />
        </section>
      </div>
    </div>
    </>
  );
}
