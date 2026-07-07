"use client";

<<<<<<< HEAD
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useSpeakingRecorder } from "@/hooks/useSpeakingRecorder";

interface SpeakingRecorderProps {
  /** Called once when a recording is finalised (stop pressed). */
  onComplete?: (audioUrl: string | null, durationSeconds: number) => void;
  /** Compact layout for tight follow-up question rows. */
  compact?: boolean;
}

function formatDuration(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Inline icon helpers — keep the page free of icon dependencies. */
function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z"
        fill="currentColor"
      />
      <path
        d="M5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0 1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V21h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-3.07A7 7 0 0 1 5 11Z"
        fill="currentColor"
      />
=======
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"; // ⬅ CHANGED: added useRef back for the pending-callback
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { cn } from "@/lib/utils";

interface SpeakingRecorderProps {
  recordingKey: string;
  value?: { audioUrl: string; durationSeconds: number } | null;
  onChange: (recording: { audioUrl: string; durationSeconds: number } | null) => void;
  disabled?: boolean;
  label?: string;
}

// ⬇ CHANGED: stopIfRecording now optionally takes a callback that fires
// ONLY after the recording has actually finished saving (or immediately,
// if there was nothing recording to stop).
export interface SpeakingRecorderHandle {
  stopIfRecording: (onSettled?: () => void) => void;
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v3" />
>>>>>>> dd93bf638b3a9424786982ca72ef20d8ee1d2be5
    </svg>
  );
}

<<<<<<< HEAD
function Waveform({ level, active }: { level: number; active: boolean }) {
  const bars = 28;
  // Render bars; when active we scale by sampled level with a CSS fallback
  // animation so the visual is never flat.
  return (
    <div className="flex h-12 items-center justify-center gap-1" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const dist = Math.abs(i - (bars - 1) / 2) / ((bars - 1) / 2);
        const height = active ? 0.25 + (1 - dist) * (0.35 + Math.min(0.6, level * 4)) : 0.2;
        return (
          <span
            key={i}
            className={cn(
              "w-1 rounded-full",
              active ? "bg-indigo-500 nb-wave-bar" : "bg-slate-300"
            )}
            style={{
              height: `${Math.round(height * 48)}px`,
              animationDelay: `${(i % 7) * 0.08}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Full speaking recorder UI: large mic, pulse rings, live waveform, timer, and
 * record / pause / resume / stop / replay / delete / re-record controls.
 */
export function SpeakingRecorder({
  onComplete,
  compact = false,
}: SpeakingRecorderProps) {
  const {
    status,
    audioUrl,
    durationSeconds,
    level,
    error,
    start,
    pause,
    resume,
    stop,
    reset,
  } = useSpeakingRecorder();

  const reportedRef = useRef(false);
  useEffect(() => {
    // Report exactly once when the recorder transitions to "stopped".
    if (status === "stopped" && !reportedRef.current) {
      reportedRef.current = true;
      onComplete?.(audioUrl, durationSeconds);
    }
    if (status !== "stopped") {
      reportedRef.current = false;
    }
  }, [status, audioUrl, durationSeconds, onComplete]);

  const isRecording = status === "recording";
  const isPaused = status === "paused";
  const hasRecording = status === "stopped" && !!audioUrl;
  const isActive = isRecording || isPaused;

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white",
        compact ? "p-4" : "p-5 sm:p-6"
      )}
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
        {/* Microphone button with pulse rings */}
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          {isRecording ? (
            <>
              <span className="nb-rec-ring absolute inset-0 rounded-full bg-rose-400/40" />
              <span className="nb-rec-ring nb-rec-ring-delay absolute inset-0 rounded-full bg-rose-400/40" />
            </>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (isRecording) pause();
              else if (isPaused) resume();
              else if (hasRecording) {
                reset();
                void start();
              } else void start();
            }}
            aria-label={
              isRecording ? "Pause recording" : hasRecording ? "Re-record" : "Start recording"
            }
            className={cn(
              "relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95",
              isRecording
                ? "bg-rose-500 hover:bg-rose-600"
                : hasRecording
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-[#553285] hover:bg-[#432668]"
            )}
          >
            <MicIcon className="h-7 w-7" />
          </button>
        </div>

        {/* Timer + waveform */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:items-stretch">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                isRecording
                  ? "bg-rose-50 text-rose-600"
                  : isPaused
                    ? "bg-amber-50 text-amber-600"
                    : hasRecording
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isRecording
                    ? "animate-pulse bg-rose-500"
                    : isPaused
                      ? "bg-amber-500"
                      : hasRecording
                        ? "bg-emerald-500"
                        : "bg-slate-400"
                )}
              />
              {isRecording ? "Recording" : isPaused ? "Paused" : hasRecording ? "Recorded" : "Ready"}
            </span>
            <span className="font-mono text-lg font-semibold tabular-nums text-slate-900">
              {formatDuration(durationSeconds)}
            </span>
          </div>

          <Waveform level={level} active={isActive} />
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-center text-xs text-rose-600 sm:text-left">{error}</p>
      ) : null}

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {isActive ? (
          <>
            {isPaused ? (
              <button
                type="button"
                onClick={resume}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                Resume
              </button>
            ) : (
              <button
                type="button"
                onClick={pause}
                className="inline-flex items-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
              >
                Pause
              </button>
            )}
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
            >
              Stop
            </button>
          </>
        ) : null}

        {hasRecording ? (
          <>
            <button
              type="button"
              onClick={() => void start()}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Re-record
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              Delete
            </button>
          </>
        ) : null}
      </div>

      {/* Replay + upload status */}
      {hasRecording ? (
        <div className="mt-4">
          <p className="mb-1 text-xs font-medium text-slate-500">Replay your recording</p>
          <audio className="w-full" controls src={audioUrl ?? undefined}>
            <track kind="captions" />
          </audio>
          <p className="mt-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              Upload status: queued — audio will be sent to the AI for analysis when you finish.
            </span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
=======
function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export const SpeakingRecorder = forwardRef<SpeakingRecorderHandle, SpeakingRecorderProps>(
  function SpeakingRecorder(
    { recordingKey, value, onChange, disabled = false, label = "Tap the mic to record your answer" },
    ref
  ) {
    const { isRecording, audioUrl, durationSeconds, error, start, stop, clear } =
      useAudioRecorder();

    // ⬇ ADDED: holds a "go ahead and advance now" callback while we wait
    // for the async recording-stop to actually finish and save.
    const pendingAdvanceRef = useRef<(() => void) | null>(null);

    useImperativeHandle(ref, () => ({
      stopIfRecording: (onSettled) => {
        if (isRecording) {
          // ⬇ CHANGED: don't advance yet — store the callback, it will run
          // only once the audioUrl effect below confirms the save is done.
          pendingAdvanceRef.current = onSettled ?? null;
          stop();
        } else {
          // Nothing was recording, so it's safe to advance right away.
          onSettled?.(); // ⬅ ADDED
        }
      },
    }));

    useEffect(() => {
      clear();
    }, [recordingKey, clear]);

    useEffect(() => {
      if (audioUrl && !isRecording) {
        onChange({ audioUrl, durationSeconds });

        // ⬇ ADDED: the recording for THIS question is now safely saved —
        // only now is it safe to tell the parent to move to the next
        // question. This is what eliminates the race condition.
        if (pendingAdvanceRef.current) {
          const advance = pendingAdvanceRef.current;
          pendingAdvanceRef.current = null;
          advance();
        }
      }
    }, [audioUrl, durationSeconds, isRecording, onChange]);

    const hasRecording = Boolean(value?.audioUrl);
    const displayUrl = value?.audioUrl ?? audioUrl;

    const handleToggle = () => {
      if (disabled) return;
      if (isRecording) {
        stop();
      } else {
        clear();
        onChange(null);
        void start();
      }
    };

    const handleReRecord = () => {
      if (disabled) return;
      clear();
      onChange(null);
    };

    return (
      <div className="flex flex-col items-center">
        <p className="mb-4 text-center text-sm text-slate-600">{label}</p>

        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          className={cn(
            "relative flex h-20 w-20 items-center justify-center rounded-full transition-all",
            disabled && "cursor-not-allowed opacity-50",
            isRecording
              ? "bg-rose-500 text-white shadow-lg shadow-rose-200 ring-4 ring-rose-100"
              : hasRecording
                ? "bg-emerald-500 text-white shadow-md"
                : "bg-[#553285] text-white shadow-md hover:bg-[#432668]"
          )}
        >
          {isRecording ? (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-400 opacity-30" />
              <StopIcon className="relative h-8 w-8" />
            </>
          ) : hasRecording ? (
            <CheckIcon className="h-9 w-9" />
          ) : (
            <MicIcon className="h-9 w-9" />
          )}
        </button>

        <p className="mt-3 text-xs font-medium text-slate-500">
          {disabled
            ? "Recording unavailable during preparation"
            : isRecording
              ? "Recording… tap to stop"
              : hasRecording
                ? `Recorded · ${value?.durationSeconds ?? 0}s · tap mic to re-record`
                : "Tap mic to start"}
        </p>

        {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

        {displayUrl && !isRecording ? (
          <div className="mt-4 w-full max-w-sm space-y-2">
            <audio className="w-full" controls src={displayUrl}>
              <track kind="captions" />
            </audio>
            {hasRecording ? (
              <button
                type="button"
                onClick={handleReRecord}
                disabled={disabled}
                className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
              >
                Record again
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }
);
>>>>>>> dd93bf638b3a9424786982ca72ef20d8ee1d2be5
