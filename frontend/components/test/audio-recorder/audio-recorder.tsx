"use client";

import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { Button } from "@/components/ui/button";

export function AudioRecorder() {
  const { isRecording, audioUrl, start, stop } = useAudioRecorder();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-medium text-slate-700">Record your speaking answer</p>
      <div className="mt-4 flex gap-3">
        {!isRecording ? (
          <Button type="button" onClick={start}>
            Start recording
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={stop}>
            Stop recording
          </Button>
        )}
      </div>
      {audioUrl && (
        <audio className="mt-4 w-full" controls src={audioUrl}>
          <track kind="captions" />
        </audio>
      )}
    </div>
  );
}
