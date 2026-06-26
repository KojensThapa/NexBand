"use client";

export function AnalysisLoader({ message = "Analyzing your answers with AI…" }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-[#553285]" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">Please wait</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <p className="mt-4 text-xs text-slate-400">
          This may take a few moments while our AI reviews your submission.
        </p>
      </div>
    </div>
  );
}
