"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnalysisLoader } from "@/components/reports/analysis-loader";
import { SubmitTestButton } from "@/components/test/submit-test-button";
import { useTimer } from "@/hooks/useTimer";
import {
  analyzeListeningSubmission,
  createSavedReport,
} from "@/lib/reports/mock-analysis";
import { saveReport } from "@/lib/reports/storage";
import {
  saveListeningAnswers,
  startListeningAttempt,
  submitListeningAttempt,
  type ListeningResult,
} from "@/services/listening";
import {
  countListeningQuestions,
  LISTENING_MOCK_SECONDS,
  LISTENING_PART_SECONDS,
} from "@/lib/exams/ielts-listening";
import {
  countMockTestQuestions,
  countPartQuestions,
  getPartQuestionOffset,
} from "@/lib/admin/listening-to-exam";
import { getListeningAudioUrl } from "@/lib/admin/listening-audio-storage";
import { cn } from "@/lib/utils";
import type {
  ListeningMockTest,
  ListeningPart,
  ListeningPartNumber,
  ListeningTableCell,
} from "@/types/listening";
import type { ListeningFeedbackDetail } from "@/types/report";

interface ListeningSessionProps {
  mockTest: ListeningMockTest;
  initialPart?: ListeningPartNumber;
  backHref?: string;
}

function formatAudioTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function QuestionBadge({ number }: { number: number }) {
  return (
    <span className="mx-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#553285] text-xs font-semibold text-white">
      {number}
    </span>
  );
}

function TableCellContent({
  cell,
  partId,
  answers,
  onChange,
  questionOffset,
}: {
  cell: string | ListeningTableCell[];
  partId: string;
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
  questionOffset: number;
}) {
  if (typeof cell === "string") {
    return <span>{cell}</span>;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {cell.map((segment, index) => {
        if (segment.questionNumber) {
          const qId = segment.questionId ?? `${partId}-q${segment.questionNumber}`;
          return (
            <span key={index} className="inline-flex flex-wrap items-center">
              {segment.textBefore}
              <QuestionBadge number={segment.questionNumber + questionOffset} />
              <input
                type="text"
                value={answers[qId] ?? ""}
                onChange={(event) => onChange(qId, event.target.value)}
                className="mx-1 w-24 rounded border border-slate-300 px-2 py-1 text-sm outline-none focus:border-[#553285] focus:ring-1 focus:ring-[#553285]"
              />
              {segment.textAfter}
            </span>
          );
        }
        return <span key={index}>{segment.textBefore}</span>;
      })}
    </span>
  );
}

function getQuestionId(part: ListeningPart, questionNumber: number) {
  return (
    part.questions?.find((question) => question.number === questionNumber)?.id ??
    `${part.id}-q${questionNumber}`
  );
}

function createBackendListeningDetail(
  taskTitle: string,
  result: ListeningResult
): ListeningFeedbackDetail {
  return {
    taskTitle,
    overallScore: result.bandScore,
    correctCount: result.correctAnswers,
    totalQuestions: result.totalQuestions,
    accuracyPercentage: result.percentage,
    timeTaken: "Recorded by your test session",
    partScores: [
      {
        label: "Full test",
        score: result.bandScore,
        correct: result.correctAnswers,
        total: result.totalQuestions,
      },
    ],
    questionTypePerformance: [
      {
        type: "All scored questions",
        score: result.bandScore,
        correct: result.correctAnswers,
        total: result.totalQuestions,
      },
    ],
    strengths:
      result.percentage >= 70
        ? ["Strong overall listening accuracy in this submitted test."]
        : ["You completed a persisted listening attempt that you can revisit in your reports."],
    weakAreas:
      result.percentage >= 70
        ? ["Review individual question types to turn a good result into a more consistent score."]
        : ["Review missed answers and practise question types where you lost marks."],
    aiSummary: `Your basic listening score is ${result.correctAnswers} of ${result.totalQuestions} (${result.percentage}%), with a provisional Band ${result.bandScore.toFixed(1)}.`,
    recommendedTopics: [
      "Question preview and keyword prediction",
      "Spelling and number accuracy",
      "Recognising paraphrase in audio",
    ],
  };
}

export function ListeningSession({
  mockTest,
  initialPart,
  backHref = "/test/ielts/listening",
}: ListeningSessionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedBackHref = searchParams.get("back") ?? backHref;

  const isPartOnly = initialPart !== undefined;
  const visibleParts = isPartOnly
    ? mockTest.parts.filter((p) => p.partNumber === initialPart)
    : mockTest.parts;

  const [activePartNumber, setActivePartNumber] = useState<ListeningPartNumber>(
    initialPart ?? 1
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [storedAudio, setStoredAudio] = useState<{
    key: string;
    url: string;
  } | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activePart =
    visibleParts.find((p) => p.partNumber === activePartNumber) ?? visibleParts[0];

  useEffect(() => {
    const audioKey = activePart.audioStorageKey;
    if (!audioKey) return;

    let disposed = false;
    let objectUrl: string | undefined;

    void getListeningAudioUrl(audioKey)
      .then((url) => {
        if (!url) return;
        if (disposed) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setStoredAudio({ key: audioKey, url });
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activePart.audioStorageKey]);

  const audioSource = activePart.audioStorageKey
    ? storedAudio?.key === activePart.audioStorageKey
      ? storedAudio.url
      : undefined
    : activePart.audioUrl;

  const timerSeconds = isPartOnly ? LISTENING_PART_SECONDS : LISTENING_MOCK_SECONDS;

  const { formatted, isRunning, isFinished, start, pause, reset } = useTimer(
    timerSeconds,
    { autoStart: true }
  );

  const questionOffset = getPartQuestionOffset(mockTest, activePart.partNumber);
  const partQuestionCount = countPartQuestions(activePart);
  const displayQuestionEnd = questionOffset + partQuestionCount;

  const answeredInPart = useMemo(() => {
    return Array.from({ length: partQuestionCount }, (_, i) => {
      const qId = getQuestionId(activePart, i + 1);
      return Boolean(answers[qId]?.trim());
    }).filter(Boolean).length;
  }, [activePart, answers, partQuestionCount]);

  const totalAnswered = useMemo(
    () => Object.values(answers).filter((v) => v.trim()).length,
    [answers]
  );

  useEffect(() => {
    if (!mockTest.isBackendTest || isPartOnly) return;

    let active = true;
    void startListeningAttempt(mockTest.id)
      .then(({ attempt }) => {
        if (active) setAttemptId(attempt.id);
      })
      .catch((error: unknown) => {
        if (active) {
          setAttemptError(
            error instanceof Error
              ? error.message
              : "Could not start the listening attempt."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [isPartOnly, mockTest.id, mockTest.isBackendTest]);

  useEffect(() => {
    if (!attemptId || !mockTest.isBackendTest) return;

    const timeout = window.setTimeout(() => {
      void saveListeningAnswers(attemptId, answers).catch((error: unknown) => {
        setAttemptError(
          error instanceof Error ? error.message : "Answers could not be saved."
        );
      });
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [answers, attemptId, mockTest.isBackendTest]);

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const toggleAudio = () => {
    if (audioSource && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        void audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
      return;
    }
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      const interval = setInterval(() => {
        setAudioProgress((p) => {
          if (p >= activePart.audioDurationSeconds) {
            clearInterval(interval);
            setIsPlaying(false);
            return activePart.audioDurationSeconds;
          }
          return p + 1;
        });
      }, 1000);
    }
  };

  const handleFinish = useCallback(async () => {
    setIsAnalyzing(true);
    pause();

    const taskTitle = isPartOnly
      ? `${mockTest.title} â€” Part ${initialPart}`
      : mockTest.title;

    if (mockTest.isBackendTest && !isPartOnly) {
      if (!attemptId) {
        setAttemptError("Your attempt is not ready yet. Please sign in and wait a moment before submitting.");
        setIsAnalyzing(false);
        return;
      }

      try {
        const { result } = await submitListeningAttempt(attemptId, answers);
        const detail = createBackendListeningDetail(taskTitle, result);
        const report = createSavedReport(
          "listening",
          taskTitle,
          `${result.correctAnswers} of ${result.totalQuestions} answers correct`,
          result.bandScore,
          detail
        );
        saveReport(report);
        router.push(`/report/${report.id}`);
        return;
      } catch (error) {
        setAttemptError(
          error instanceof Error ? error.message : "Your listening test could not be submitted."
        );
        setIsAnalyzing(false);
        return;
      }
    }

    const totalQuestions = isPartOnly
      ? partQuestionCount
      : countMockTestQuestions(mockTest);
    const detail = await analyzeListeningSubmission({
      taskTitle: isPartOnly
        ? `${mockTest.title} — Part ${initialPart}`
        : mockTest.title,
      answeredCount: totalAnswered,
      totalQuestions,
    });

    const report = createSavedReport(
      "listening",
      isPartOnly ? `${mockTest.title} — Part ${initialPart}` : mockTest.title,
      `${totalAnswered} answers submitted`,
      detail.overallScore,
      detail
    );

    saveReport(report);
    router.push(`/report/${report.id}`);
  }, [
    initialPart,
    isPartOnly,
    attemptId,
    answers,
    mockTest.title,
    mockTest.isBackendTest,
    pause,
    router,
    totalAnswered,
    partQuestionCount,
    mockTest,
  ]);

  if (!activePart) {
    return null;
  }

  return (
    <>
      {isAnalyzing ? <AnalysisLoader message="Analyzing your listening answers…" /> : null}

      <div className="flex h-full min-h-0 flex-col bg-white">
        <header className="shrink-0 border-b border-slate-200 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href={resolvedBackHref}
              className="text-sm font-medium text-[#553285] hover:underline"
            >
              ← Back to tests
            </Link>

            <div className="flex flex-1 flex-wrap items-center justify-center gap-4">
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-sm font-semibold",
                  isFinished
                    ? "border-rose-200 bg-rose-50 text-rose-600"
                    : "border-slate-200 bg-white text-slate-900"
                )}
              >
                <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                {formatted}
                {isRunning ? (
                  <button type="button" onClick={pause} className="text-xs font-sans text-[#553285]">
                    Pause
                  </button>
                ) : (
                  <button type="button" onClick={start} className="text-xs font-sans text-[#553285]">
                    Resume
                  </button>
                )}
              </div>

              <div className="flex min-w-[240px] max-w-md flex-1 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#553285] text-white"
                >
                  {isPlaying ? (
                    <span className="text-xs">❚❚</span>
                  ) : (
                    <PlayIcon />
                  )}
                </button>
                <div className="h-1.5 flex-1 rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#553285] transition-all"
                    style={{
                      width: `${(audioProgress / activePart.audioDurationSeconds) * 100}%`,
                    }}
                  />
                </div>
                <span className="shrink-0 text-xs text-slate-500">
                  {formatAudioTime(audioProgress)} /{" "}
                  {formatAudioTime(activePart.audioDurationSeconds)}
                </span>
              </div>
            </div>

            <SubmitTestButton
              label="Finish Test"
              fullWidth={false}
              onClick={handleFinish}
              className="shrink-0 px-5 py-2"
            />
          </div>
        </header>

        {audioSource ? (
          <audio
            ref={audioRef}
            src={audioSource}
            onTimeUpdate={(event) => setAudioProgress(Math.round(event.currentTarget.currentTime))}
            onEnded={() => setIsPlaying(false)}
          />
        ) : null}

        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-center text-sm text-slate-600 sm:px-6">
          {activePart.label} — Listen and answer questions{" "}
          {questionOffset + 1}–{displayQuestionEnd}
        </div>

        {attemptError ? (
          <div className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-center text-sm text-rose-700">
            {attemptError}
          </div>
        ) : null}

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Questions {questionOffset + 1}–{displayQuestionEnd}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
              {activePart.instruction}
            </p>

            {activePart.mapImageUrl ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePart.mapImageUrl}
                  alt={activePart.mapImageAlt ?? activePart.title}
                  className="mx-auto max-h-80 object-contain"
                />
              </div>
            ) : null}

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-violet-50 text-left">
                    {activePart.tableHeaders.map((header) => (
                      <th
                        key={header}
                        className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-800"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activePart.tableRows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={cn(
                        rowIndex % 2 === 0 ? "bg-white" : "bg-violet-50/40"
                      )}
                    >
                      {row.cells.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="border-b border-slate-100 px-4 py-3 align-top text-slate-700"
                        >
                          <TableCellContent
                            cell={cell}
                            partId={activePart.id}
                            answers={answers}
                            onChange={handleAnswerChange}
                            questionOffset={questionOffset}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {partQuestionCount < countListeningQuestions(activePart) ? (
              <div className="mt-4 space-y-3">
                {Array.from(
                  { length: countListeningQuestions(activePart) - partQuestionCount },
                  (_, i) => {
                  const num = partQuestionCount + i + 1;
                  const qId = getQuestionId(activePart, num);
                  return (
                    <div
                      key={qId}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <QuestionBadge number={questionOffset + num} />
                      <input
                        type="text"
                        value={answers[qId] ?? ""}
                        onChange={(event) =>
                          handleAnswerChange(qId, event.target.value)
                        }
                        placeholder="Your answer"
                        className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#553285]"
                      />
                    </div>
                  );
                }
                )}
              </div>
            ) : null}
          </div>
        </main>

        {!isPartOnly ? (
          <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center gap-4">
              {mockTest.parts.map((part) => {
                const partCount = countPartQuestions(part);
                const partAnswered = Array.from({ length: partCount }, (_, i) =>
                  Boolean(answers[getQuestionId(part, i + 1)]?.trim())
                ).filter(Boolean).length;

                return (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => setActivePartNumber(part.partNumber)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      activePartNumber === part.partNumber
                        ? "bg-[#553285] text-white"
                        : "text-slate-600 hover:bg-violet-50"
                    )}
                  >
                    {part.label}
                    <span className="ml-2 text-xs opacity-80">
                      {partAnswered} of {partCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </footer>
        ) : null}
      </div>
    </>
  );
}

function PlayIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6.3 4.2a1 1 0 0 1 1.52-.85l7.5 4.8a1 1 0 0 1 0 1.7l-7.5 4.8A1 1 0 0 1 6.3 15.7V4.2Z" />
    </svg>
  );
}
