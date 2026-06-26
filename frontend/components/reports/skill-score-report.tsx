"use client";

import type { ListeningFeedbackDetail, ReadingFeedbackDetail } from "@/types/report";

interface SkillScoreReportProps {
  skill: "reading" | "listening";
  report: ReadingFeedbackDetail | ListeningFeedbackDetail;
}

export function SkillScoreReport({ skill, report }: SkillScoreReportProps) {
  const percentage = report.totalQuestions
    ? Math.round((report.correctCount / report.totalQuestions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          IELTS {skill === "reading" ? "Reading" : "Listening"} Result
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">{report.taskTitle}</h2>
        <div className="mt-6 flex flex-wrap gap-8">
          <div>
            <p className="text-sm text-slate-500">Estimated Band</p>
            <p className="text-4xl font-bold text-slate-900">
              {report.overallScore.toFixed(1)}
              <span className="text-xl text-slate-400">/9.0</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Correct Answers</p>
            <p className="text-4xl font-bold text-slate-900">
              {report.correctCount}
              <span className="text-xl text-slate-400">/{report.totalQuestions}</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Accuracy</p>
            <p className="text-4xl font-bold text-slate-900">{percentage}%</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">AI Feedback Summary</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{report.summary}</p>
      </section>
    </div>
  );
}
