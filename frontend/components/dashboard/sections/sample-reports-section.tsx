"use client";

import { WritingFeedbackReport } from "@/components/reports/writing-feedback-report";
import { SAMPLE_WRITING_REPORT } from "@/lib/reports/mock-analysis";

export function SampleReportsSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Explore a band-scored sample report to understand what detailed AI feedback
          looks like after a writing submission.
        </p>
      </div>
      <WritingFeedbackReport report={SAMPLE_WRITING_REPORT} />
    </div>
  );
}
