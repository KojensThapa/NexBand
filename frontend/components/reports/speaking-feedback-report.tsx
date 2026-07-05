"use client";

import type { SpeakingFeedbackDetail } from "@/types/report";

interface SpeakingFeedbackReportProps {
  report: SpeakingFeedbackDetail;
}

export function SpeakingFeedbackReport({ report }: SpeakingFeedbackReportProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Overall Band Score</p>
            <p className="text-4xl font-bold text-slate-900">
              {report.overallScore.toFixed(1)}
              <span className="text-xl font-medium text-slate-400">/9.0</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">CEFR Level</p>
            <p className="text-2xl font-bold text-slate-900">{report.cefrLevel}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Recordings Analyzed</p>
            <p className="text-2xl font-bold text-slate-900">
              {report.recordingCount}
              <span className="text-xl text-slate-400">/{report.totalQuestions}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">AI Feedback Summary</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{report.summary}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {report.criteria.map((criterion) => (
          <article
            key={criterion.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-900">{criterion.label}</h4>
              <span className="text-lg font-bold text-slate-900">
                {criterion.score.toFixed(1)}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${criterion.color}`}
                style={{ width: `${(criterion.score / 9) * 100}%` }}
              />
            </div>
            {criterion.summary ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{criterion.summary}</p>
            ) : null}
          </article>
        ))}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
          <h3 className="text-lg font-semibold text-emerald-900">Strengths</h3>
          <ul className="mt-3 space-y-2">
            {report.strengths.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-emerald-800">
                <span className="mt-0.5 text-emerald-600">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
          <h3 className="text-lg font-semibold text-amber-900">Areas to Improve</h3>
          <ul className="mt-3 space-y-2">
            {report.improvements.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-amber-900">
                <span className="mt-0.5 text-amber-600">→</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
