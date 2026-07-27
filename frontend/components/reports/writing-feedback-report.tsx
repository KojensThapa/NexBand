"use client";

import { ReportCard } from "@/components/reports/shared/report-card";
import { ReportHeader } from "@/components/reports/shared/report-header";
import { ScoreProgressBar } from "@/components/reports/shared/score-progress-bar";
import { ScoreStatGrid } from "@/components/reports/shared/score-stat-grid";
import { StrengthsList } from "@/components/reports/shared/strengths-list";
import type { ReportHeaderMeta, WritingFeedbackDetail } from "@/types/report";

interface WritingFeedbackReportProps {
  report: WritingFeedbackDetail;
  header?: ReportHeaderMeta;
}

export function WritingFeedbackReport({ report, header }: WritingFeedbackReportProps) {
  const headerMeta: ReportHeaderMeta = header ?? {
    testTitle: report.taskTitle,
    overallScore: report.overallScore,
    cefrLevel: report.cefrLevel,
    status: "Completed",
    aiSummary: report.aiSummary,
  };

  return (
    <div className="space-y-6">
      <ReportHeader {...headerMeta} skillLabel="Writing Report" />

      <ReportCard title="Score Overview">
        <ScoreStatGrid
          stats={[
            {
              label: "Overall Band Score",
              value: report.overallScore.toFixed(1),
              sublabel: "out of 9.0",
            },
            {
              label: "Word Count",
              value: String(report.wordCount),
              sublabel: report.wordCountStatus,
            },
            {
              label: "CEFR Level",
              value: report.cefrLevel,
            },
            {
              label: "Total Errors",
              value: String(
                report.grammarAnalysis.grammarErrors +
                  report.grammarAnalysis.spellingErrors +
                  report.grammarAnalysis.punctuationErrors
              ),
              sublabel: "grammar, spelling, punctuation",
            },
          ]}
        />
      </ReportCard>

      <ReportCard title="Criterion Scores">
        <div className="space-y-4">
          {report.criteria.map((criterion) => (
            <ScoreProgressBar
              key={criterion.id}
              label={criterion.label}
              score={criterion.score}
              color={criterion.color}
            />
          ))}
        </div>
      </ReportCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportCard title="Vocabulary Analysis">
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Unique Words
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {report.vocabularyAnalysis.uniqueWords}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Repeated Words</p>
              <ul className="mt-2 space-y-2">
                {report.vocabularyAnalysis.repeatedWords.map((entry) => (
                  <li
                    key={entry.word}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">{entry.word}</span>
                    <span className="text-slate-500">×{entry.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ReportCard>

        <ReportCard title="Grammar Analysis">
          <ScoreStatGrid
            stats={[
              {
                label: "Grammar Errors",
                value: String(report.grammarAnalysis.grammarErrors),
              },
              {
                label: "Spelling Errors",
                value: String(report.grammarAnalysis.spellingErrors),
              },
              {
                label: "Punctuation Errors",
                value: String(report.grammarAnalysis.punctuationErrors),
              },
            ]}
          />
        </ReportCard>
      </div>

      {report.questionRelevance ? (
        <ReportCard title="Question Relevance">
          <div className="space-y-3 text-sm text-slate-700">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Question Answered</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {report.questionRelevance.answeredQuestion ? "Yes" : "No"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">All Parts Covered</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {report.questionRelevance.coveredAllParts ? "Yes" : "No"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Topic Relevance</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {Math.round(report.questionRelevance.relevanceScore * 100)}%
                </p>
              </div>
            </div>

            {report.questionRelevance.offTopic ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 font-medium text-rose-700">
                This response does not address the question, so the Task Response score has been capped.
              </p>
            ) : null}

            {report.questionRelevance.missingPoints.length > 0 ? (
              <p>
                <span className="font-medium">Missing points: </span>
                {report.questionRelevance.missingPoints.join(", ")}
              </p>
            ) : null}
          </div>
        </ReportCard>
      ) : null}

      <ReportCard title="Detected Language Issues">
        {report.errors.length === 0 ? (
          <p className="text-sm text-slate-600">No individual grammar, spelling, or punctuation issues were detected.</p>
        ) : (
          <ul className="space-y-3">
            {report.errors.map((error) => (
              <li key={`${error.category}-${error.id}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                    {error.category}
                  </span>
                  <p className="text-sm font-medium text-slate-900">{error.title}</p>
                </div>
                <p className="mt-2 text-sm text-slate-700">{error.explanation}</p>
                {error.corrected ? (
                  <p className="mt-1 text-sm text-emerald-700">Suggested correction: {error.corrected}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </ReportCard>

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

      <ReportCard title="Suggested Improvements">
        <ul className="space-y-2">
          {report.suggestedImprovements.map((item) => (
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
