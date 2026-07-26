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
    status: report.status ?? "Completed",
    aiSummary: report.aiSummary,
  };

  return (
    <div className="space-y-6">
      <ReportHeader {...headerMeta} skillLabel="Speaking Report" />

      {report.question || report.transcript ? (
        <ReportCard title="Question and Transcript">
          <div className="space-y-4 text-sm leading-relaxed text-slate-700">
            {report.question ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Question</p>
                <p className="mt-1 whitespace-pre-wrap font-medium text-slate-900">{report.question}</p>
              </div>
            ) : null}
            {report.transcript ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deepgram Transcript</p>
                <p className="mt-1 whitespace-pre-wrap">{report.transcript}</p>
              </div>
            ) : null}
          </div>
        </ReportCard>
      ) : null}

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
            ...(report.speakingPace
              ? [{ label: "Speaking Pace", value: report.speakingPace.replace("_", " ") }]
              : []),
            ...(report.speechToTextConfidence === undefined
              ? []
              : [{ label: "STT Confidence", value: `${Math.round(report.speechToTextConfidence * 100)}%` }]),
          ]}
        />
      </ReportCard>

      {report.responseRelevance ? (
        <ReportCard title="Response Relevance" variant={report.responseRelevance.relevance === "LOW" ? "warning" : "default"}>
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-900">{report.responseRelevance.relevance}</span>
              {" · "}{report.responseRelevance.answeredQuestion ? "The question was answered." : "The answer did not fully address the question."}
            </p>
            <p className="leading-relaxed">{report.responseRelevance.reason}</p>
            {report.responseRelevance.missingPoints.length > 0 ? (
              <div>
                <p className="font-medium text-slate-900">Missing points</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {report.responseRelevance.missingPoints.map((point) => <li key={point}>{point}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        </ReportCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportCard title="Filler Word Analysis">
          {report.fillerWords.length === 0 ? <p className="text-sm text-slate-500">No filler words were detected.</p> : <ul className="space-y-2">
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
          </ul>}
        </ReportCard>

        <ReportCard title="Mispronounced Words">
          {report.mispronouncedWords.length === 0 ? <p className="text-sm text-slate-500">No clear pronunciation issues were flagged.</p> : <ul className="space-y-2">
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
          </ul>}
        </ReportCard>
      </div>

      {(report.grammarErrors?.length || report.grammarSuggestions?.length) ? (
        <ReportCard title="Grammar Feedback">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-900">Grammar errors</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {(report.grammarErrors ?? []).map((error, index) => (
                  <li key={`${error.message}-${index}`} className="rounded-lg bg-rose-50 px-3 py-2">
                    <span className="font-medium">{error.message}</span>
                    {error.suggestion ? <span> — {error.suggestion}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Suggestions</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {(report.grammarSuggestions ?? []).map((suggestion) => <li key={suggestion}>{suggestion}</li>)}
              </ul>
            </div>
          </div>
        </ReportCard>
      ) : null}

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

      {report.algorithmVersion ? (
        <p className="text-center text-xs text-slate-400">
          Deterministic scoring algorithm: {report.algorithmVersion}
          {report.pronunciationSupported === false ? " · Audio pronunciation feedback was unavailable for this recording." : ""}
        </p>
      ) : null}
    </div>
  );
}
