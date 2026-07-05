"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clear = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDurationSeconds(0);
    setError(null);
  }, [audioUrl]);

  const start = useCallback(async () => {
    try {
      setError(null);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const elapsed = Math.max(
          1,
          Math.round((Date.now() - startTimeRef.current) / 1000)
        );
        setDurationSeconds(elapsed);
        setAudioUrl(url);
        cleanupStream();
      };

      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      recorder.start();
      setIsRecording(true);
    } catch {
      setError("Microphone access denied. Please allow microphone permissions.");
    }
  }, [audioUrl, cleanupStream]);

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      cleanupStream();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl, cleanupStream]);

  return {
    isRecording,
    audioUrl,
    durationSeconds,
    error,
    start,
    stop,
    clear,
  };
}
