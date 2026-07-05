"use client";

import type {
  ListeningFeedbackDetail,
  ReadingFeedbackDetail,
  SavedReport,
  SpeakingFeedbackDetail,
  WritingFeedbackDetail,
} from "@/types/report";
import { SpeakingFeedbackReport } from "./speaking-feedback-report";
import { WritingFeedbackReport } from "./writing-feedback-report";
import { SkillScoreReport } from "./skill-score-report";

interface ReportViewerProps {
  report: SavedReport;
}

export function ReportViewer({ report }: ReportViewerProps) {
  if (report.skill === "writing") {
    return (
      <WritingFeedbackReport
        report={report.detail as WritingFeedbackDetail}
        showTabs={false}
      />
    );
  }

  if (report.skill === "reading") {
    return (
      <SkillScoreReport
        skill="reading"
        report={report.detail as ReadingFeedbackDetail}
      />
    );
  }

  if (report.skill === "listening") {
    return (
      <SkillScoreReport
        skill="listening"
        report={report.detail as ListeningFeedbackDetail}
      />
    );
  }

  if (report.skill === "speaking") {
    return (
      <SpeakingFeedbackReport report={report.detail as SpeakingFeedbackDetail} />
    );
  }

  return null;
}
