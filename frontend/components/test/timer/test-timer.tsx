"use client";

import { useTimer } from "@/hooks/useTimer";

interface TestTimerProps {
  initialSeconds: number;
}

export function TestTimer({ initialSeconds }: TestTimerProps) {
  const { formatted, isRunning, start, pause, reset } = useTimer(initialSeconds);

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 font-mono text-sm">
      <span className="font-semibold text-slate-900">{formatted}</span>
      {!isRunning ? (
        <button type="button" onClick={start} className="text-indigo-600 hover:underline">
          Start
        </button>
      ) : (
        <button type="button" onClick={pause} className="text-indigo-600 hover:underline">
          Pause
        </button>
      )}
      <button type="button" onClick={() => reset()} className="text-slate-500 hover:underline">
        Reset
      </button>
    </div>
  );
}
