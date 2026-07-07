"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "recording" | "paused" | "stopped";

export interface SpeakingRecorderState {
  status: RecorderStatus;
  /** Object URL of the latest recording (available after stop). */
  audioUrl: string | null;
  /** Recorded duration in seconds (excludes paused time). */
  durationSeconds: number;
  /** Latest audio level (0–1) for live waveform rendering. */
  level: number;
  /** Error message if mic access or recording failed. */
  error: string | null;
}

export interface SpeakingRecorderActions {
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  /** Discard the current recording and reset to idle. */
  reset: () => void;
}

/**
 * A richer audio recorder for the speaking test. Wraps MediaRecorder with
 * pause/resume, a live amplitude level (via Web Audio AnalyserNode) for the
 * waveform UI, a recording timer, and a replayable object URL.
 *
 * Browser-only — must be used from a Client Component.
 */
export function useSpeakingRecorder(): SpeakingRecorderState & SpeakingRecorderActions {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  const stopLevelSampling = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setLevel(0);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    intervalRef.current = setInterval(() => {
      setDurationSeconds((s) => s + 1);
    }, 1000);
  }, [stopTimer]);

  const sampleLevel = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      // RMS amplitude, normalised to 0–1.
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      setLevel((prev) => prev * 0.6 + rms * 0.4); // smooth
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const teardownAudioGraph = useCallback(() => {
    stopLevelSampling();
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  }, [stopLevelSampling]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    // Release any previous object URL to avoid leaks.
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }
    setAudioUrl(null);
    setDurationSeconds(0);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Your browser does not support audio recording.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Web Audio graph for live amplitude.
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserRef.current = analyser;
      }

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        prevUrlRef.current = url;
        setAudioUrl(url);
        teardownAudioGraph();
        stopStream();
        stopTimer();
        setStatus("stopped");
      };

      recorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
      startTimer();
      sampleLevel();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not access the microphone.";
      setError(message);
      setStatus("idle");
      teardownAudioGraph();
      stopStream();
    }
  }, [sampleLevel, startTimer, stopStream, stopTimer, teardownAudioGraph]);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.pause();
      setStatus("paused");
      stopTimer();
      stopLevelSampling();
    }
  }, [stopLevelSampling, stopTimer]);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "paused") {
      recorder.resume();
      setStatus("recording");
      startTimer();
      sampleLevel();
    }
  }, [sampleLevel, startTimer]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop(); // triggers onstop -> sets audioUrl + status
    }
  }, []);

  const reset = useCallback(() => {
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }
    setAudioUrl(null);
    setDurationSeconds(0);
    setStatus("idle");
    setError(null);
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      stopTimer();
      teardownAudioGraph();
      stopStream();
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
    };
  }, [stopStream, stopTimer, teardownAudioGraph]);

  return {
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
  };
}
