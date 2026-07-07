"use client";

import type {
  ListeningFeedbackDetail,
  ReadingFeedbackDetail,
  SavedReport,
  SpeakingFeedbackDetail,
  WritingFeedbackDetail,
} from "@/types/report";
import { ListeningFeedbackReport } from "./listening-feedback-report";
import { ReadingFeedbackReport } from "./reading-feedback-report";
import { SpeakingFeedbackReport } from "./speaking-feedback-report";
import { WritingFeedbackReport } from "./writing-feedback-report";

interface ReportViewerProps {
  report: SavedReport;
}

export function ReportViewer({ report }: ReportViewerProps) {
  const header = {
    testTitle: report.taskTitle,
    testDate: new Date(report.createdAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    overallScore: report.score,
    status: report.status,
    backHref: "/dashboard?section=reports",
    backLabel: "Back to My Reports",
    aiSummary:
      report.skill === "writing"
        ? (report.detail as WritingFeedbackDetail).aiSummary
        : report.skill === "speaking"
          ? (report.detail as SpeakingFeedbackDetail).aiSummary
          : report.skill === "reading"
            ? (report.detail as ReadingFeedbackDetail).aiSummary
            : (report.detail as ListeningFeedbackDetail).aiSummary,
    ...(report.skill === "writing" || report.skill === "speaking"
      ? {
          cefrLevel: (report.detail as WritingFeedbackDetail | SpeakingFeedbackDetail)
            .cefrLevel,
        }
      : {}),
  };

  if (report.skill === "writing") {
    return (
      <WritingFeedbackReport
        report={report.detail as WritingFeedbackDetail}
        header={header}
      />
    );
  }

  if (report.skill === "reading") {
    return (
      <ReadingFeedbackReport
        report={report.detail as ReadingFeedbackDetail}
        header={header}
      />
    );
  }

  if (report.skill === "listening") {
    return (
      <ListeningFeedbackReport
        report={report.detail as ListeningFeedbackDetail}
        header={header}
      />
    );
  }

  if (report.skill === "speaking") {
    return (
      <SpeakingFeedbackReport
        report={report.detail as SpeakingFeedbackDetail}
        header={header}
      />
    );
  }

  return null;
}
