"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTimer } from "@/hooks/useTimer";
import type { SpeakingCueCard, SpeakingQuestion } from "@/types/speaking";
import { SPEAKING_TIMINGS } from "@/lib/exams/ielts-speaking";
import { CircularProgress } from "./circular-progress";
import { SpeakingRecorder } from "./speaking-recorder";

interface CueCardFlowProps {
  cueCard: SpeakingCueCard;
  followUps: SpeakingQuestion[];
  /** Called when the whole part (monologue + follow-ups) is finished. */
  onComplete: (recordedIds: string[]) => void;
  /** Render a section header above (provided by the session). */
  title?: string;
  finishLabel?: string;
}

type Phase = "prep" | "speak" | "followups";

/** Part 2 flow: cue card → 1 min prep (circular countdown) → 2–3 min speak → follow-ups. */
export function CueCardFlow({
  cueCard,
  followUps,
  onComplete,
  title = "Part 2 — Cue Card",
  finishLabel = "Finish Part 2",
}: CueCardFlowProps) {
  const [phase, setPhase] = useState<Phase>("prep");
  const [autoStarted, setAutoStarted] = useState(false);
  const [recorded, setRecorded] = useState<Set<string>>(new Set());
  const [fuIndex, setFuIndex] = useState(0);

  const prep = useTimer(SPEAKING_TIMINGS.part2PrepSeconds, { autoStart: true });
  const speak = useTimer(SPEAKING_TIMINGS.part2SpeakSeconds, { autoStart: false });

  // When prep finishes, move to speaking phase.
  useEffect(() => {
    if (phase === "prep" && prep.isFinished) {
      setPhase("speak");
    }
  }, [phase, prep.isFinished]);

  // Auto-start the speaking timer once and warn when it elapses.
  useEffect(() => {
    if (phase === "speak" && !autoStarted) {
      speak.start();
      setAutoStarted(true);
    }
  }, [phase, autoStarted, speak]);

  const markRecorded = useCallback((id: string) => {
    setRecorded((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleFollowUpNext = () => {
    if (fuIndex < followUps.length - 1) setFuIndex((i) => i + 1);
    else onComplete(Array.from(recorded));
  };

  const currentFu = followUps[fuIndex];

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {phase === "prep"
            ? "Prepare for 1 minute. Make notes in your head, then you'll speak for 2–3 minutes."
            : phase === "speak"
              ? "Speak continuously about the topic. Try to keep going until the time runs out."
              : "Now answer the follow-up questions briefly."}
        </p>
      </header>

      {/* Cue card (always visible during prep + speak) */}
      {phase !== "followups" ? (
        <article
          className={cn(
            "nb-fade-up relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 shadow-sm sm:p-7"
          )}
        >
          <div className="absolute right-4 top-4 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-indigo-700 backdrop-blur">
            {cueCard.topicLabel ?? "Cue Card"}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
            Describe…
          </p>
          <h3 className="mt-1 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
            {cueCard.prompt}
          </h3>
          <p className="mt-4 text-sm font-medium text-slate-500">You should say:</p>
          <ul className="mt-2 space-y-1.5">
            {cueCard.points.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                {point}
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {/* PREP phase: circular countdown */}
      {phase === "prep" ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Preparation time</p>
          <CircularProgress
            value={SPEAKING_TIMINGS.part2PrepSeconds - prep.secondsLeft}
            max={SPEAKING_TIMINGS.part2PrepSeconds}
            size={140}
            stroke={10}
            progressClassName="text-indigo-600"
          >
            <div className="text-center">
              <p className="font-mono text-3xl font-bold tabular-nums text-slate-900">
                {prep.formatted}
              </p>
              <p className="text-xs text-slate-400">remaining</p>
            </div>
          </CircularProgress>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={prep.isRunning ? prep.pause : prep.start}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {prep.isRunning ? "Pause" : "Resume"}
            </button>
            <button
              type="button"
              onClick={() => prep.reset(0)}
              className="rounded-lg bg-[#553285] px-4 py-2 text-sm font-medium text-white hover:bg-[#432668]"
            >
              Skip to speaking
            </button>
          </div>
        </div>
      ) : null}

      {/* SPEAK phase: recording + speaking countdown */}
      {phase === "speak" ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <CircularProgress
                value={SPEAKING_TIMINGS.part2SpeakSeconds - speak.secondsLeft}
                max={SPEAKING_TIMINGS.part2SpeakSeconds}
                size={96}
                stroke={8}
                progressClassName={speak.isFinished ? "text-rose-500" : "text-emerald-500"}
              >
                <div className="text-center">
                  <p className="font-mono text-lg font-bold tabular-nums text-slate-900">
                    {speak.formatted}
                  </p>
                </div>
              </CircularProgress>
              <div>
                <p className="text-sm font-semibold text-slate-900">Speaking time</p>
                <p className="text-xs text-slate-500">
                  {speak.isFinished
                    ? "Time's up — you can stop recording and continue."
                    : "Keep speaking until the timer ends."}
                </p>
              </div>
            </div>
          </div>

          <SpeakingRecorder onComplete={() => markRecorded(cueCard.id)} />

          <div className="flex justify-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setPhase("followups")}
              className="inline-flex items-center rounded-lg bg-[#553285] px-5 py-2 text-sm font-medium text-white hover:bg-[#432668]"
            >
              Continue to follow-ups →
            </button>
          </div>
        </div>
      ) : null}

      {/* FOLLOW-UP phase */}
      {phase === "followups" ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-500 shadow-sm">
            <span>Follow-up question {fuIndex + 1} of {followUps.length}</span>
            <span>{recorded.size} recorded</span>
          </div>

          {currentFu ? (
            <article key={currentFu.id} className="nb-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                  {fuIndex + 1}
                </span>
                <h3 className="pt-1 text-base font-semibold leading-relaxed text-slate-900 sm:text-lg">
                  {currentFu.text}
                </h3>
              </div>
              <div className="mt-5">
                <SpeakingRecorder compact onComplete={() => markRecorded(currentFu.id)} />
              </div>
            </article>
          ) : null}

          <div className="flex justify-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={handleFollowUpNext}
              className="inline-flex items-center rounded-lg bg-[#553285] px-5 py-2 text-sm font-medium text-white hover:bg-[#432668]"
            >
              {fuIndex === followUps.length - 1 ? finishLabel : "Next question →"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
