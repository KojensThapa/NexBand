"use client";

import { ReportCard } from "@/components/reports/shared/report-card";
import { ReportHeader } from "@/components/reports/shared/report-header";
import { ScoreProgressBar } from "@/components/reports/shared/score-progress-bar";
import { ScoreStatGrid } from "@/components/reports/shared/score-stat-grid";
import { StrengthsList } from "@/components/reports/shared/strengths-list";
import type { ListeningFeedbackDetail, ReportHeaderMeta } from "@/types/report";

interface ListeningFeedbackReportProps {
  report: ListeningFeedbackDetail;
  header?: ReportHeaderMeta;
}

export function ListeningFeedbackReport({ report, header }: ListeningFeedbackReportProps) {
  const headerMeta: ReportHeaderMeta = header ?? {
    testTitle: report.taskTitle,
    overallScore: report.overallScore,
    status: "Completed",
    aiSummary: report.aiSummary,
  };

  return (
    <div className="space-y-6">
      <ReportHeader {...headerMeta} skillLabel="Listening Report" />

      <ReportCard title="Score Overview">
        <ScoreStatGrid
          stats={[
            {
              label: "Overall Band Score",
              value: report.overallScore.toFixed(1),
              sublabel: "out of 9.0",
            },
            {
              label: "Correct Answers",
              value: `${report.correctCount}/${report.totalQuestions}`,
            },
            {
              label: "Accuracy",
              value: `${report.accuracyPercentage}%`,
            },
            {
              label: "Time Taken",
              value: report.timeTaken,
            },
          ]}
        />
      </ReportCard>

      <ReportCard title="Part Scores">
        <div className="space-y-4">
          {report.partScores.map((part) => (
            <div key={part.label} className="space-y-2">
              <ScoreProgressBar
                label={`${part.label} (${part.correct}/${part.total} correct)`}
                score={part.score}
                color="bg-violet-500"
              />
            </div>
          ))}
        </div>
      </ReportCard>

      <ReportCard title="Question Type Performance">
        <div className="space-y-4">
          {report.questionTypePerformance.map((entry) => (
            <ScoreProgressBar
              key={entry.type}
              label={`${entry.type} (${entry.correct}/${entry.total})`}
              score={entry.score}
              color="bg-emerald-500"
            />
          ))}
        </div>
      </ReportCard>

      <div className="grid gap-6 sm:grid-cols-2">
        <StrengthsList title="Strengths" items={report.strengths} variant="strength" />
        <StrengthsList title="Weak Areas" items={report.weakAreas} variant="weakness" />
      </div>

      <ReportCard title="AI Feedback Summary">
        <p className="text-sm leading-relaxed text-slate-600">{report.aiSummary}</p>
      </ReportCard>

      <ReportCard title="Recommended Practice Topics">
        <ul className="space-y-2">
          {report.recommendedTopics.map((topic) => (
            <li
              key={topic}
              className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              <span className="mt-0.5 text-[#553285]">•</span>
              {topic}
            </li>
          ))}
        </ul>
      </ReportCard>
    </div>
  );
}
