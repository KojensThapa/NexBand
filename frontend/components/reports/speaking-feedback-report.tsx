"use client";

import { ReportCard } from "@/components/reports/shared/report-card";
import { ReportHeader } from "@/components/reports/shared/report-header";
import { ScoreProgressBar } from "@/components/reports/shared/score-progress-bar";
import { ScoreStatGrid } from "@/components/reports/shared/score-stat-grid";
import { StrengthsList } from "@/components/reports/shared/strengths-list";
import type { ReportHeaderMeta, SpeakingFeedbackDetail } from "@/types/report";

interface SpeakingFeedbackReportProps {
  report: SpeakingFeedbackDetail;
  header?: ReportHeaderMeta;
}

export function SpeakingFeedbackReport({ report, header }: SpeakingFeedbackReportProps) {
  const headerMeta: ReportHeaderMeta = header ?? {
    testTitle: report.taskTitle,
    overallScore: report.overallScore,
    cefrLevel: report.cefrLevel,
    status: "Completed",
    aiSummary: report.aiSummary,
  };

  return (
    <div className="space-y-6">
      <ReportHeader {...headerMeta} skillLabel="Speaking Report" />

      <ReportCard title="Score Overview">
        <ScoreStatGrid
          stats={[
            {
              label: "Overall Band Score",
              value: report.overallScore.toFixed(1),
              sublabel: "out of 9.0",
            },
            {
              label: "CEFR Level",
              value: report.cefrLevel,
            },
            {
              label: "Recordings Analyzed",
              value: `${report.recordingCount}/${report.totalQuestions}`,
            },
          ]}
        />
      </ReportCard>

      <ReportCard title="Criterion Scores">
        <div className="space-y-4">
          {report.criteria.map((criterion) => (
            <div key={criterion.id} className="space-y-2">
              <ScoreProgressBar
                label={criterion.label}
                score={criterion.score}
                color={criterion.color}
              />
              {criterion.summary ? (
                <p className="text-sm leading-relaxed text-slate-600">{criterion.summary}</p>
              ) : null}
            </div>
          ))}
        </div>
      </ReportCard>

      <ReportCard title="Recording Statistics">
        <ScoreStatGrid
          stats={[
            {
              label: "Duration",
              value: report.recordingStats.duration,
            },
            {
              label: "Words Per Minute",
              value: String(report.recordingStats.wordsPerMinute),
            },
          ]}
        />
      </ReportCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportCard title="Filler Word Analysis">
          <ul className="space-y-2">
            {report.fillerWords.map((entry) => (
              <li
                key={entry.word}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-800">&ldquo;{entry.word}&rdquo;</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {entry.count} times
                </span>
              </li>
            ))}
          </ul>
        </ReportCard>

        <ReportCard title="Mispronounced Words">
          <ul className="space-y-2">
            {report.mispronouncedWords.map((entry) => (
              <li
                key={entry.word}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-rose-700">{entry.word}</span>
                <span className="mx-2 text-slate-400">→</span>
                <span className="text-emerald-700">{entry.suggestion}</span>
              </li>
            ))}
          </ul>
        </ReportCard>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <StrengthsList title="Strengths" items={report.strengths} variant="strength" />
        <StrengthsList
          title="Areas to Improve"
          items={report.improvements}
          variant="weakness"
        />
      </div>

      <ReportCard title="AI Feedback Summary">
        <p className="text-sm leading-relaxed text-slate-600">{report.aiSummary}</p>
      </ReportCard>

      <ReportCard title="Practice Recommendations">
        <ul className="space-y-2">
          {report.practiceRecommendations.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              <span className="mt-0.5 text-[#553285]">•</span>
              {item}
            </li>
          ))}
        </ul>
      </ReportCard>
    </div>
  );
}
