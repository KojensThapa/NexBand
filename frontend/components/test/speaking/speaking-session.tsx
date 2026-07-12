"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnalysisLoader } from "@/components/reports/analysis-loader";
import { SubmitTestButton } from "@/components/test/submit-test-button";
import {
  SpeakingRecorder,
  type SpeakingRecorderHandle,
} from "@/components/test/speaking/speaking-recorder";
import { useTimer } from "@/hooks/useTimer";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import {
  SPEAKING_PART1_SECONDS,
  SPEAKING_PART3_SECONDS,
} from "@/lib/exams/ielts-speaking";
import {
  analyzeSpeakingSubmission,
  createSavedReport,
} from "@/lib/reports/mock-analysis";
import { saveReport } from "@/lib/reports/storage";
import { cn } from "@/lib/utils";
import type {
  SpeakingBoardMode,
  SpeakingMockTest,
  SpeakingPart1Task,
  SpeakingPart2Task,
  SpeakingPart3Task,
  SpeakingPartNumber,
  SpeakingRecording,
} from "@/types/speaking";

type Part2Phase = "prep" | "speak" | "followup";

interface SpeakingSessionProps {
  mode: SpeakingBoardMode;
  mockTest?: SpeakingMockTest;
  part1Task?: SpeakingPart1Task;
  part2Task?: SpeakingPart2Task;
  part3Task?: SpeakingPart3Task;
  backHref?: string;
}

function getVisibleParts(mode: SpeakingBoardMode): SpeakingPartNumber[] {
  if (mode === "part-1") return [1];
  if (mode === "part-2") return [2];
  if (mode === "part-3") return [3];
  return [1, 2, 3];
}

function getSessionTitle(
  mode: SpeakingBoardMode,
  mockTest?: SpeakingMockTest,
  part1Task?: SpeakingPart1Task,
  part2Task?: SpeakingPart2Task,
  part3Task?: SpeakingPart3Task
): string {
  if (mockTest) return mockTest.title;
  if (part1Task) return part1Task.title;
  if (part2Task) return part2Task.title;
  if (part3Task) return part3Task.title;
  return "Speaking Practice";
}

export function SpeakingSession({
  mode,
  mockTest,
  part1Task,
  part2Task,
  part3Task,
  backHref = "/test/ielts/speaking",
}: SpeakingSessionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedBackHref = searchParams.get("back") ?? backHref;

  const part1 = mockTest?.part1 ?? part1Task?.part1;
  const part2 = mockTest?.part2 ?? part2Task?.part2;
  const part3 = mockTest?.part3 ?? part3Task?.part3;

  const visibleParts = getVisibleParts(mode);
  const [activePart, setActivePart] = useState<SpeakingPartNumber>(visibleParts[0]);
  const [part2Phase, setPart2Phase] = useState<Part2Phase>("prep");
  const [part1QuestionIndex, setPart1QuestionIndex] = useState(0);
  const [part3QuestionIndex, setPart3QuestionIndex] = useState(0);
  const [followUpIndex, setFollowUpIndex] = useState(0);
  const [recordings, setRecordings] = useState<Record<string, SpeakingRecording>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { speak, stop: stopSpeech } = useTextToSpeech();

  // Ref to the currently-mounted SpeakingRecorder instance, so Next/Previous/
  // tab buttons can force it to stop recording (and wait for the save to
  // finish) before moving on to the next question.
  const recorderRef = useRef<SpeakingRecorderHandle>(null);

  const timerSeconds = useMemo(() => {
    if (activePart === 1) return SPEAKING_PART1_SECONDS;
    if (activePart === 2) {
      const prepSeconds = (part2?.prepMinutes ?? 1) * 60;
      const speakSeconds = (part2?.speakMinutes ?? 2) * 60;
      if (part2Phase === "prep") return prepSeconds;
      return speakSeconds;
    }
    return SPEAKING_PART3_SECONDS;
  }, [activePart, part2Phase, part2?.prepMinutes, part2?.speakMinutes]);

  const timerKey = `${activePart}-${part2Phase}`;
  const { formatted, isRunning, isFinished, start, pause, reset } = useTimer(timerSeconds, {
    autoStart: true,
  });

  useEffect(() => {
    reset(timerSeconds);
    start();
  }, [timerKey, timerSeconds, reset, start]);

  useEffect(() => {
    if (!isFinished) return;
    if (activePart === 2 && part2Phase === "prep") {
      setPart2Phase("speak");
    }
  }, [isFinished, activePart, part2Phase]);

  const sessionTitle = getSessionTitle(mode, mockTest, part1Task, part2Task, part3Task);

  const recordingCount = Object.keys(recordings).length;

  const canSubmit = useMemo(() => {
    if (recordingCount === 0) return false;
    if (mode === "part-1" && part1) {
      return part1.questions.some((q) => recordings[q.id]);
    }
    if (mode === "part-2" && part2) {
      return Boolean(recordings["part2-main"]);
    }
    if (mode === "part-3" && part3) {
      return part3.questions.some((q) => recordings[q.id]);
    }
    if (mockTest) {
      const hasPart1 = mockTest.part1.questions.some((q) => recordings[q.id]);
      const hasPart2 = Boolean(recordings["part2-main"]);
      const hasPart3 = mockTest.part3.questions.some((q) => recordings[q.id]);
      return hasPart1 && hasPart2 && hasPart3;
    }
    return recordingCount > 0;
  }, [recordingCount, mode, part1, part2, part3, mockTest, recordings]);

  const setRecording = useCallback((key: string, value: SpeakingRecording | null) => {
    setRecordings((prev) => {
      if (!value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const handleSubmit = useCallback(() => {
    // Wait for any in-progress recording to finish saving before running
    // the analysis — this prevents losing the last answer if the user
    // clicks Submit while still mid-recording.
    recorderRef.current?.stopIfRecording(async () => {
      setIsAnalyzing(true);
      pause();
      stopSpeech();

      const detail = await analyzeSpeakingSubmission({
        taskTitle: sessionTitle,
        recordingCount,
        totalQuestions:
          (part1?.questions.length ?? 0) +
          1 +
          (part2?.cueCard.followUpQuestions.length ?? 0) +
          (part3?.questions.length ?? 0),
      });

      const report = createSavedReport(
        "speaking",
        sessionTitle,
        `${recordingCount} recordings submitted for AI analysis`,
        detail.overallScore,
        detail
      );

      saveReport(report);
      router.push(`/report/${report.id}`);
    });
  }, [sessionTitle, recordingCount, part1, part2, part3, pause, stopSpeech, router]);

  const part1Question = part1?.questions[part1QuestionIndex];
  const part3Question = part3?.questions[part3QuestionIndex];
  const followUpQuestion = part2?.cueCard.followUpQuestions[followUpIndex];

  // Speak the current question aloud whenever it changes
  useEffect(() => {
    if (activePart === 1 && part1Question) {
      speak(part1Question.text);
    } else if (activePart === 2) {
      if (part2Phase === "prep" && part2) {
        speak(part2.cueCard.prompt);
      } else if (part2Phase === "followup" && followUpQuestion) {
        speak(followUpQuestion.text);
      }
    } else if (activePart === 3 && part3Question) {
      speak(part3Question.text);
    }
  }, [activePart, part2Phase, part1Question, part3Question, followUpQuestion, part2, speak]);

  const renderPartTabs = () => (
    <div className="flex gap-2">
      {visibleParts.map((partNum) => {
        const isActive = activePart === partNum;
        const partDone =
          partNum === 1
            ? part1?.questions.some((q) => recordings[q.id])
            : partNum === 2
              ? Boolean(recordings["part2-main"])
              : part3?.questions.some((q) => recordings[q.id]);

        return (
          <button
            key={partNum}
            type="button"
            onClick={() => {
              // Wait for any active recording to finish saving before
              // switching parts, so the ✓ lands on the correct question.
              recorderRef.current?.stopIfRecording(() => {
                setActivePart(partNum);
                if (partNum === 2) setPart2Phase("prep");
              });
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Part {partNum}
            {partDone ? " ✓" : ""}
          </button>
        );
      })}
    </div>
  );

  const renderPart1 = () => {
    if (!part1 || !part1Question) return null;

    return (
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="flex w-full flex-col overflow-y-auto border-b border-slate-200 bg-white p-4 sm:p-6 lg:w-1/2 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              Part 1 · Introduction & Interview
            </span>
            <span className="text-xs text-slate-500">
              Question {part1QuestionIndex + 1} of {part1.questions.length}
            </span>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
            {part1Question.text}
          </h2>

          <p className="mt-4 text-sm text-slate-600">
            Answer naturally in 20–30 seconds. The examiner will ask {part1.questions.length}{" "}
            questions in about {part1.durationMinutes} minutes.
          </p>

          <ul className="mt-6 space-y-2">
            {part1.questions.map((q, index) => (
              <li
                key={q.id}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  index === part1QuestionIndex
                    ? "bg-indigo-50 font-medium text-indigo-900"
                    : recordings[q.id]
                      ? "text-emerald-700"
                      : "text-slate-500"
                )}
              >
                {index + 1}. {q.text}
                {recordings[q.id] ? " ✓" : ""}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              disabled={part1QuestionIndex === 0}
              onClick={() => {
                recorderRef.current?.stopIfRecording(() => {
                  setPart1QuestionIndex((i) => i - 1);
                });
              }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={part1QuestionIndex >= part1.questions.length - 1}
              onClick={() => {
                recorderRef.current?.stopIfRecording(() => {
                  setPart1QuestionIndex((i) => i + 1);
                });
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Next question
            </button>
          </div>
        </section>

        <section className="flex w-full flex-col items-center justify-center bg-slate-50 p-6 lg:w-1/2">
          <SpeakingRecorder
            ref={recorderRef}
            recordingKey={part1Question.id}
            value={recordings[part1Question.id] ?? null}
            onChange={(rec) => setRecording(part1Question.id, rec)}
            label="Record your answer to this question"
          />
        </section>
      </div>
    );
  };

  const renderPart2 = () => {
    if (!part2) return null;
    const { cueCard } = part2;

    if (part2Phase === "prep") {
      return (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6">
          <span className="rounded-full bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-800">
            Preparation time · {part2.prepMinutes} minute
          </span>
          <h2 className="mt-6 text-center text-xl font-bold text-slate-900">
            {cueCard.prompt}
          </h2>
          <p className="mt-2 text-sm text-slate-500">You should say:</p>
          <ul className="mt-4 max-w-md space-y-2">
            {cueCard.bulletPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-sm text-slate-500">
            Take notes if you wish. Recording starts when preparation time ends, or tap below.
          </p>
          <button
            type="button"
            onClick={() => setPart2Phase("speak")}
            className="mt-4 rounded-xl bg-[#553285] px-6 py-3 text-sm font-medium text-white hover:bg-[#432668]"
          >
            Start speaking now
          </button>
        </div>
      );
    }

    if (part2Phase === "speak") {
      return (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <section className="flex w-full flex-col overflow-y-auto border-b border-slate-200 bg-white p-4 sm:p-6 lg:w-1/2 lg:border-b-0 lg:border-r">
            <span className="w-fit rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
              Part 2 · Long Turn · Speak for {part2.speakMinutes} minutes
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{cueCard.prompt}</h2>
            <ul className="mt-4 space-y-2">
              {cueCard.bulletPoints.map((point, index) => (
                <li key={index} className="text-sm text-slate-600">
                  · {point}
                </li>
              ))}
            </ul>
          </section>

          <section className="flex w-full flex-col items-center justify-center bg-slate-50 p-6 lg:w-1/2">
            <SpeakingRecorder
              ref={recorderRef}
              recordingKey="part2-main"
              value={recordings["part2-main"] ?? null}
              onChange={(rec) => setRecording("part2-main", rec)}
              label="Record your 2–3 minute response"
            />
            {recordings["part2-main"] ? (
              <button
                type="button"
                onClick={() => {
                  recorderRef.current?.stopIfRecording(() => {
                    setPart2Phase("followup");
                  });
                }}
                className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white"
              >
                Continue to follow-up questions →
              </button>
            ) : null}
          </section>
        </div>
      );
    }

    if (!followUpQuestion) return null;

    return (
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="flex w-full flex-col overflow-y-auto border-b border-slate-200 bg-white p-4 sm:p-6 lg:w-1/2 lg:border-b-0 lg:border-r">
          <span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
            Part 2 · Follow-up
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            {followUpQuestion.text}
          </h2>
          <p className="mt-4 text-sm text-slate-600">
            Brief follow-up questions about your Part 2 topic.
          </p>
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              disabled={followUpIndex === 0}
              onClick={() => {
                recorderRef.current?.stopIfRecording(() => {
                  setFollowUpIndex((i) => i - 1);
                });
              }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={followUpIndex >= part2.cueCard.followUpQuestions.length - 1}
              onClick={() => {
                recorderRef.current?.stopIfRecording(() => {
                  setFollowUpIndex((i) => i + 1);
                });
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>

        <section className="flex w-full flex-col items-center justify-center bg-slate-50 p-6 lg:w-1/2">
          <SpeakingRecorder
            ref={recorderRef}
            recordingKey={followUpQuestion.id}
            value={recordings[followUpQuestion.id] ?? null}
            onChange={(rec) => setRecording(followUpQuestion.id, rec)}
            label="Record your follow-up answer"
          />
        </section>
      </div>
    );
  };

  const renderPart3 = () => {
    if (!part3 || !part3Question) return null;

    return (
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="flex w-full flex-col overflow-y-auto border-b border-slate-200 bg-white p-4 sm:p-6 lg:w-1/2 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              Part 3 · Discussion · {part3.topic}
            </span>
            <span className="text-xs text-slate-500">
              Question {part3QuestionIndex + 1} of {part3.questions.length}
            </span>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
            {part3Question.text}
          </h2>

          <p className="mt-4 text-sm text-slate-600">
            Give detailed, analytical answers. Part 3 lasts about {part3.durationMinutes}{" "}
            minutes with deeper discussion on the Part 2 topic.
          </p>

          <ul className="mt-6 space-y-2">
            {part3.questions.map((q, index) => (
              <li
                key={q.id}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  index === part3QuestionIndex
                    ? "bg-indigo-50 font-medium text-indigo-900"
                    : recordings[q.id]
                      ? "text-emerald-700"
                      : "text-slate-500"
                )}
              >
                {index + 1}. {q.text}
                {recordings[q.id] ? " ✓" : ""}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              disabled={part3QuestionIndex === 0}
              onClick={() => {
                recorderRef.current?.stopIfRecording(() => {
                  setPart3QuestionIndex((i) => i - 1);
                });
              }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={part3QuestionIndex >= part3.questions.length - 1}
              onClick={() => {
                recorderRef.current?.stopIfRecording(() => {
                  setPart3QuestionIndex((i) => i + 1);
                });
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Next question
            </button>
          </div>
        </section>

        <section className="flex w-full flex-col items-center justify-center bg-slate-50 p-6 lg:w-1/2">
          <SpeakingRecorder
            ref={recorderRef}
            recordingKey={part3Question.id}
            value={recordings[part3Question.id] ?? null}
            onChange={(rec) => setRecording(part3Question.id, rec)}
            label="Record your discussion answer"
          />
        </section>
      </div>
    );
  };

  return (
    <>
      {isAnalyzing ? (
        <AnalysisLoader message="Analyzing your speaking with AI…" />
      ) : null}

      <div className="flex h-full min-h-0 flex-col bg-slate-100">
        <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
              <p className="text-sm text-slate-500">
                {recordingCount} recording{recordingCount !== 1 ? "s" : ""} saved
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              {visibleParts.length > 1 ? renderPartTabs() : null}

              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-sm font-semibold sm:px-4 sm:py-2 sm:text-base",
                  isFinished
                    ? "border-rose-200 bg-rose-50 text-rose-600"
                    : "border-slate-200 bg-white text-slate-900"
                )}
              >
                {formatted}
                {activePart === 2 && part2Phase === "prep" ? (
                  <span className="text-xs font-sans font-normal text-amber-600">prep</span>
                ) : null}
                {isRunning ? (
                  <button
                    type="button"
                    onClick={pause}
                    className="text-xs font-sans font-medium text-indigo-600 hover:underline"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={start}
                    className="text-xs font-sans font-medium text-indigo-600 hover:underline"
                  >
                    Resume
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activePart === 1 ? renderPart1() : null}
          {activePart === 2 ? renderPart2() : null}
          {activePart === 3 ? renderPart3() : null}
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
          <SubmitTestButton
            onClick={handleSubmit}
            disabled={!canSubmit}
            label="Submit for AI feedback"
          />
          {!canSubmit ? (
            <p className="mt-2 text-center text-xs text-slate-500">
              Record at least one answer in each required part before submitting.
            </p>
          ) : null}
        </footer>
      </div>
    </>
  );
}