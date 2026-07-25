import assert from "node:assert/strict";
import test from "node:test";

import { evaluateWriting } from "../src/modules/writing/algorithm/writingAlgorithm";
import type { EssayAnalysis, GrammarResult } from "../src/modules/writing/algorithm/types";
import type {
  StartedWritingSubmission,
  WritingEvaluationRepositoryPort,
} from "../src/modules/writing/repository/writing.repository";
import {
  WritingEvaluationService,
  type WritingProviders,
} from "../src/modules/writing/services/writing.service";

const grammarResult: GrammarResult = {
  score: 78,
  grammarErrors: [{ message: "Verb agreement", suggestion: "use are" }],
  spellingErrors: [],
  punctuationErrors: [],
  suggestions: ["Check subject-verb agreement."],
};

const essayAnalysis: EssayAnalysis = {
  taskAchievementScore: 7,
  coherenceScore: 7,
  vocabularyScore: 7,
  estimatedBand: 7,
  keywordCoverage: 80,
  summary: "The response addresses the main features.",
};

test("writing evaluator uses provider grammar data and applies the IELTS word-count penalty", () => {
  const report = evaluateWriting({
    essay: "Overall, the figure increased. The figure increased from 10% to 30%, which was higher than the other value.",
    taskNumber: 1,
    grammarResult,
    essayAnalysis,
    questionMetadata: { expectedKeywords: ["figure", "increased", "value", "percentage", "overall"] },
    completedTaskNumbers: [1],
  });

  assert.equal(report.status, "Incomplete");
  assert.equal(report.wordCountMetrics.minimumWordCount, 150);
  assert.equal(report.wordCountMetrics.isBelowMinimum, true);
  assert.ok(report.wordCountMetrics.wordCountPenalty > 0);
  assert.equal(report.grammarScore, 7.02);
  assert.deepEqual(report.grammarErrors, grammarResult.grammarErrors);
  assert.ok(report.strengths.includes("Good comparison language."));
  assert.ok(report.weakAreas.includes("Low word count."));
  assert.ok(report.recommendations.some((recommendation) => recommendation.includes("150 words")));
});

test("writing service calls providers, creates individual reports, and returns a completed mock report", async () => {
  let completed: unknown;
  const repository: WritingEvaluationRepositoryPort = {
    async startSubmission(): Promise<StartedWritingSubmission> {
      return { id: "submission-1" };
    },
    async completeSubmission(_submissionId, result) {
      completed = result;
      return { id: "submission-1", status: "COMPLETED", result };
    },
    async markFailed() {
      throw new Error("The happy path must not mark a submission as failed.");
    },
    async findSubmissionForUser() {
      return null;
    },
  };
  const providers: WritingProviders = {
    grammar: { async analyze() { return grammarResult; } },
    essayAnalysis: { async analyze() { return essayAnalysis; } },
  };
  const service = new WritingEvaluationService(repository, providers);
  const result = await service.submit("user-1", {
    mode: "mock",
    tasks: [
      {
        taskNumber: 1,
        essay: "Overall, the figures increased from 10% to 30%, while the second figure declined. Compared with the other group, the first group was higher.",
        questionMetadata: { prompt: "Summarise the chart." },
      },
      {
        taskNumber: 2,
        essay: "Introduction to the topic. I believe public investment is important because it improves access. For example, communities benefit from better services. In conclusion, governments should invest carefully.",
        questionMetadata: { prompt: "Discuss both views." },
      },
    ],
  });

  assert.equal((result as { status: string }).status, "COMPLETED");
  const persisted = completed as { taskEvaluations: Array<{ report: { status: string } }>; mockReport?: { status: string; taskReports: unknown[] } };
  assert.equal(persisted.taskEvaluations.length, 2);
  assert.ok(persisted.taskEvaluations.every((evaluation) => evaluation.report.status === "Completed"));
  assert.equal(persisted.mockReport?.status, "Completed");
  assert.equal(persisted.mockReport?.taskReports.length, 2);
});
