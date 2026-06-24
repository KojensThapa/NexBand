"use client";

import { useCallback, useEffect, useState } from "react";

interface UseTimerOptions {
  autoStart?: boolean;
}

export function useTimer(initialSeconds: number, options?: UseTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(options?.autoStart ?? false);

  useEffect(() => {
    if (options?.autoStart) {
      setIsRunning(true);
    }
  }, [options?.autoStart]);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;

    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, secondsLeft]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(
    (seconds = initialSeconds) => {
      setIsRunning(false);
      setSecondsLeft(seconds);
    },
    [initialSeconds]
  );

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return {
    secondsLeft,
    formatted,
    isRunning,
    isFinished: secondsLeft === 0,
    start,
    pause,
    reset,
  };
}
