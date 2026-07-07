"use client";

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
    </svg>
  );
}

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