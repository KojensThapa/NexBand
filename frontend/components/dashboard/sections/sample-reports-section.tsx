"use client";

import { useState } from "react";
import type { IeltsSkill } from "@/types/exam";
import { ListeningFeedbackReport } from "@/components/reports/listening-feedback-report";
import { ReadingFeedbackReport } from "@/components/reports/reading-feedback-report";
import { SpeakingFeedbackReport } from "@/components/reports/speaking-feedback-report";
import { SkillTabs } from "@/components/reports/shared/skill-tabs";
import { WritingFeedbackReport } from "@/components/reports/writing-feedback-report";
import {
  SAMPLE_LISTENING_REPORT,
  SAMPLE_READING_REPORT,
  SAMPLE_SPEAKING_REPORT,
  SAMPLE_WRITING_REPORT,
} from "@/lib/reports/mock-analysis";

export function SampleReportsSection() {
  const [activeSkill, setActiveSkill] = useState<IeltsSkill>("writing");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Explore band-scored sample reports to see the detailed AI feedback you receive
          after completing a writing, reading, listening, or speaking test.
        </p>
      </div>

      <SkillTabs activeSkill={activeSkill} onSkillChange={setActiveSkill} />

      {activeSkill === "writing" ? (
        <WritingFeedbackReport report={SAMPLE_WRITING_REPORT} />
      ) : null}
      {activeSkill === "reading" ? (
        <ReadingFeedbackReport report={SAMPLE_READING_REPORT} />
      ) : null}
      {activeSkill === "listening" ? (
        <ListeningFeedbackReport report={SAMPLE_LISTENING_REPORT} />
      ) : null}
      {activeSkill === "speaking" ? (
        <SpeakingFeedbackReport report={SAMPLE_SPEAKING_REPORT} />
      ) : null}
    </div>
  );
}
