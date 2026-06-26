"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { AnalysisLoader } from "@/components/reports/analysis-loader";
import { SubmitTestButton } from "@/components/test/submit-test-button";
import { useTimer } from "@/hooks/useTimer";
import {
  analyzeListeningSubmission,
  createSavedReport,
} from "@/lib/reports/mock-analysis";
import { saveReport } from "@/lib/reports/storage";
import {
  countListeningQuestions,
  LISTENING_MOCK_SECONDS,
  LISTENING_PART_SECONDS,
} from "@/lib/exams/ielts-listening";
import { cn } from "@/lib/utils";
import type {
  ListeningMockTest,
  ListeningPart,
  ListeningPartNumber,
  ListeningTableCell,
} from "@/types/listening";

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
          const qId = `${partId}-q${segment.questionNumber}`;
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activePart =
    visibleParts.find((p) => p.partNumber === activePartNumber) ?? visibleParts[0];

  const timerSeconds = isPartOnly ? LISTENING_PART_SECONDS : LISTENING_MOCK_SECONDS;

  const { formatted, isRunning, isFinished, start, pause, reset } = useTimer(
    timerSeconds,
    { autoStart: true }
  );

  const questionOffset = (activePart.partNumber - 1) * 10;

  const partQuestionCount = countListeningQuestions(activePart);

  const answeredInPart = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const qId = `${activePart.id}-q${i + 1}`;
      return Boolean(answers[qId]?.trim());
    }).filter(Boolean).length;
  }, [activePart.id, answers]);

  const totalAnswered = useMemo(
    () => Object.values(answers).filter((v) => v.trim()).length,
    [answers]
  );

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const toggleAudio = () => {
    if (activePart.audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
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

    const totalQuestions = isPartOnly ? 10 : 40;
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
    mockTest.title,
    pause,
    router,
    totalAnswered,
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

        {activePart.audioUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio ref={audioRef} src={activePart.audioUrl} />
        ) : null}

        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-center text-sm text-slate-600 sm:px-6">
          {activePart.label} — Listen and answer questions{" "}
          {questionOffset + 1}–{questionOffset + 10}
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Questions {questionOffset + 1}–{questionOffset + 10}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
              {activePart.instruction}
            </p>

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

            {partQuestionCount < 10 ? (
              <div className="mt-4 space-y-3">
                {Array.from({ length: 10 - partQuestionCount }, (_, i) => {
                  const num = partQuestionCount + i + 1;
                  const qId = `${activePart.id}-q${num}`;
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
                })}
              </div>
            ) : null}
          </div>
        </main>

        {!isPartOnly ? (
          <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center gap-4">
              {mockTest.parts.map((part) => {
                const partAnswered = Array.from({ length: 10 }, (_, i) =>
                  Boolean(answers[`${part.id}-q${i + 1}`]?.trim())
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
                      {partAnswered} of 10
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
