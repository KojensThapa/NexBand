import type { SkillFeedback } from "@/types/result";

interface AiFeedbackProps {
  bandScore: number;
  feedback: SkillFeedback;
}

export function AiFeedback({ bandScore, feedback }: AiFeedbackProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">AI feedback</h2>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
          Band {bandScore}
        </span>
      </div>
      <p className="text-sm text-slate-600">{feedback.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-emerald-50 p-4">
          <h3 className="text-sm font-medium text-emerald-800">Strengths</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-emerald-700">
            {feedback.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <h3 className="text-sm font-medium text-amber-800">Improvements</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-700">
            {feedback.improvements.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
