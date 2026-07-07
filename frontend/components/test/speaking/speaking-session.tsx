"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AnalysisLoader } from "@/components/reports/analysis-loader";
import { useTimer } from "@/hooks/useTimer";
import { cn } from "@/lib/utils";
import {
  MOCK_BREAKDOWN,
  SPEAKING_PART1_QUESTIONS,
  SPEAKING_TIMINGS,
} from "@/lib/exams/ielts-speaking";
import { analyzeSpeakingSubmission, createSavedReport } from "@/lib/reports/mock-analysis";
import { saveReport } from "@/lib/reports/storage";
import type { SpeakingPartId, SpeakingTest } from "@/types/speaking";
import { SpeakingQuestionFlow } from "./speaking-question-flow";
import { CueCardFlow } from "./cue-card-flow";

interface SpeakingSessionProps {
  test: SpeakingTest;
  backHref?: string;
}

type MockStage = "part-1" | "part-2" | "part-3";

/** Part labels for the mock stepper. */
const MOCK_STEPS: { id: MockStage; label: string }[] = [
  { id: "part-1", label: "Part 1" },
  { id: "part-2", label: "Part 2" },
  { id: "part-3", label: "Part 3" },
];

export function SpeakingSession({
  test,
  backHref = "/test/ielts/speaking",
}: SpeakingSessionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedBackHref = searchParams.get("back") ?? backHref;
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock test state.
  const [stage, setStage] = useState<MockStage>("part-1");
  const isMock = test.part === "mock";

  // Overall mock timer.
  const mockTimer = useTimer(SPEAKING_TIMINGS.mockTotalSeconds, {
    autoStart: isMock,
  });

  const handleSubmit = useCallback(
    async (recordedIds: string[]) => {
      setIsAnalyzing(true);
      const topic = isMock ? MOCK_BREAKDOWN.topic : test.topics[0];
      const questionCount =
        isMock
          ? MOCK_BREAKDOWN.part1Count +
            1 +
            MOCK_BREAKDOWN.followUpCount +
            MOCK_BREAKDOWN.part3Count
          : test.questionCount;

      const detail = await analyzeSpeakingSubmission({
        taskTitle: test.title,
        questionCount,
        recordedCount: Math.max(1, recordedIds.length),
        totalSeconds: SPEAKING_TIMINGS.mockTotalSeconds - mockTimer.secondsLeft,
      });

      const report = createSavedReport(
        "speaking",
        test.title,
        test.description.slice(0, 80),
        detail.overallScore,
        detail
      );

      saveReport(report);
      router.push(`/report/${report.id}`);
    },
    [isMock, mockTimer.secondsLeft, router, test.description, test.questionCount, test.title, test.topics]
  );

  // ---- Per-part rendering ----------------------------------------------

  const handlePart1Done = useCallback(
    (recordedIds: string[]) => {
      if (isMock) {
        setStage("part-2");
      } else {
        void handleSubmit(recordedIds);
      }
    },
    [handleSubmit, isMock]
  );

  const handlePart2Done = useCallback(
    (recordedIds: string[]) => {
      if (isMock) {
        setStage("part-3");
      } else {
        void handleSubmit(recordedIds);
      }
    },
    [handleSubmit, isMock]
  );

  // Resolve the part-1 questions (mock uses the shared set; single part uses its topic).
  const part1Questions = useMemo(
    () => (isMock ? SPEAKING_PART1_QUESTIONS : test.topics[0]?.discussionQuestions ?? []),
    [isMock, test.topics]
  );

  const part3Questions = useMemo(() => {
    if (isMock) return MOCK_BREAKDOWN.topic.discussionQuestions;
    return test.topics[0]?.discussionQuestions ?? [];
  }, [isMock, test.topics]);

  const cueCard = (isMock ? MOCK_BREAKDOWN.topic : test.topics[0])?.cueCard;
  const followUps = isMock
    ? MOCK_BREAKDOWN.topic.followUpQuestions
    : (test.topics[0]?.followUpQuestions ?? []);

  const stageIndex = MOCK_STEPS.findIndex((s) => s.id === stage);

  return (
    <>
      {isAnalyzing ? (
        <AnalysisLoader message="Analyzing your speaking with AI…" />
      ) : null}

      <div className="flex h-full min-h-0 flex-col bg-slate-100">
        <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Link
                href={resolvedBackHref}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                ← Back to options
              </Link>
              <h1 className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl">
                {test.title}
              </h1>
              <p className="text-sm text-slate-500">
                {test.durationLabel} · {test.questionCount} questions
              </p>
            </div>

            <div
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-sm font-semibold sm:px-4 sm:py-2 sm:text-base",
                mockTimer.isFinished
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : "border-slate-200 bg-white text-slate-900"
              )}
            >
              {isMock ? (
                <>
                  <span className="text-xs font-sans font-medium text-slate-400">Total</span>
                  {mockTimer.formatted}
                </>
              ) : null}
            </div>
          </div>

          {/* Mock stepper */}
          {isMock ? (
            <div className="mt-3 flex items-center gap-1.5">
              {MOCK_STEPS.map((step, i) => {
                const done = i < stageIndex;
                const active = i === stageIndex;
                return (
                  <div key={step.id} className="flex flex-1 items-center gap-1.5">
                    <div className="flex flex-1 items-center gap-2">
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                          active
                            ? "bg-[#553285] text-white"
                            : done
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-200 text-slate-500"
                        )}
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          active ? "text-slate-900" : "text-slate-400"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    <div className="hidden h-0.5 flex-1 bg-slate-200 sm:block">
                      <div
                        className={cn(
                          "h-full bg-indigo-500 transition-all duration-500",
                          done ? "w-full" : "w-0"
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-3xl">
            {/* Render the active part. For single-part tests we render that part directly. */}
            {(!isMock && test.part === "part-1") || (isMock && stage === "part-1") ? (
              <SpeakingQuestionFlow
                key="p1"
                questions={part1Questions}
                sectionSeconds={SPEAKING_TIMINGS.part1Seconds}
                sectionTitle="Part 1 — Introduction & Interview"
                sectionHint="The examiner asks general questions about yourself. Answer naturally and add a little detail."
                finishLabel={isMock ? "Continue to Part 2 →" : "Finish & get feedback"}
                onComplete={handlePart1Done}
              />
            ) : null}

            {(!isMock && test.part === "part-2") || (isMock && stage === "part-2") ? (
              cueCard ? (
                <CueCardFlow
                  key="p2"
                  cueCard={cueCard}
                  followUps={followUps}
                  onComplete={handlePart2Done}
                  finishLabel={isMock ? "Continue to Part 3 →" : "Finish & get feedback"}
                />
              ) : null
            ) : null}

            {(!isMock && test.part === "part-3") || (isMock && stage === "part-3") ? (
              <SpeakingQuestionFlow
                key="p3"
                questions={part3Questions}
                sectionSeconds={SPEAKING_TIMINGS.part3Seconds}
                sectionTitle="Part 3 — Discussion"
                sectionHint="Discuss abstract ideas related to the topic in more depth."
                finishLabel="Finish & get feedback"
                onComplete={handleSubmit}
              />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

export type { SpeakingPartId };
