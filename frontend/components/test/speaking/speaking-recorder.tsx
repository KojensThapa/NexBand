"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { resolveApiUrl } from "@/lib/constants";
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
    // A parent re-render creates a new onChange callback. Remember the blob
    // that was already delivered so that a completed recording is uploaded once.
    const deliveredAudioUrlRef = useRef<string | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement>(null);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

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
      if (
        audioUrl &&
        !isRecording &&
        deliveredAudioUrlRef.current !== audioUrl
      ) {
        deliveredAudioUrlRef.current = audioUrl;
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

    const displayUrl = value?.audioUrl
      ? resolveApiUrl(value.audioUrl)
      : audioUrl;
    const hasRecording = Boolean(displayUrl);

    useEffect(() => {
      previewAudioRef.current?.pause();
      setIsPreviewPlaying(false);
      setPreviewError(null);
    }, [displayUrl]);

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
      previewAudioRef.current?.pause();
      clear();
      onChange(null);
    };

    const handlePreviewToggle = async () => {
      const preview = previewAudioRef.current;
      if (!preview) return;

      if (preview.paused) {
        try {
          await preview.play();
          setIsPreviewPlaying(true);
          setPreviewError(null);
        } catch {
          setPreviewError("This recording could not be played. Please record it again.");
        }
      } else {
        preview.pause();
        setIsPreviewPlaying(false);
      }
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
                ? `Recorded · ${value?.durationSeconds ?? durationSeconds}s · tap mic to re-record`
                : "Tap mic to start"}
        </p>

        {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

        {displayUrl && !isRecording ? (
          <div className="mt-4 w-full max-w-sm space-y-2">
            <audio
              ref={previewAudioRef}
              className="sr-only"
              src={displayUrl}
              onEnded={() => setIsPreviewPlaying(false)}
              onError={() => {
                setIsPreviewPlaying(false);
                setPreviewError("This recording could not be played. Please record it again.");
              }}
            />
            <button
              type="button"
              onClick={() => void handlePreviewToggle()}
              className="w-full rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
            >
              {isPreviewPlaying ? "Pause recording" : "Play recording"}
            </button>
            {previewError ? <p className="text-xs text-rose-600">{previewError}</p> : null}
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
