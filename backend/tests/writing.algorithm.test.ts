import assert from "node:assert/strict";
import test from "node:test";

import { evaluateWriting } from "../src/modules/writing/algorithm/writingAlgorithm";
import type { EssayAnalysis, GrammarResult } from "../src/modules/writing/algorithm/types";
import { GeminiWritingProvider } from "../src/modules/writing/providers/gemini-writing.provider";
import { LocalGrammarProvider } from "../src/modules/writing/providers/local-grammar.provider";
import { createWritingSubmissionSchema } from "../src/modules/writing/writing.schemas";
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

test("an early mock submission with only one attempted task stays incomplete", async () => {
  let completed: unknown;
  const repository: WritingEvaluationRepositoryPort = {
    async startSubmission() { return { id: "submission-partial-mock" }; },
    async completeSubmission(_id, result) { completed = result; return result; },
    async markFailed() { throw new Error("The partial mock should be saved."); },
    async findSubmissionForUser() { return null; },
  };
  const providers: WritingProviders = {
    grammar: { async analyze() { return grammarResult; } },
    essayAnalysis: { async analyze() { return essayAnalysis; } },
  };

  const input = {
    mode: "mock",
    tasks: [{
      taskNumber: 1,
      essay: "Overall, the figure increased from 10% to 30%, while the other figure declined.",
      questionMetadata: { prompt: "Summarise the chart." },
    }],
  };
  const parsed = createWritingSubmissionSchema.safeParse(input);
  assert.equal(parsed.success, true);
  if (!parsed.success) assert.fail("An early mock submission should be valid.");

  await new WritingEvaluationService(repository, providers).submit("user-1", parsed.data);

  const persisted = completed as {
    taskEvaluations: Array<{ report: { status: string } }>;
    mockReport?: { status: string };
  };
  assert.equal(persisted.taskEvaluations[0]?.report.status, "Incomplete");
  assert.equal(persisted.mockReport?.status, "Incomplete");
});

test("GeminiWritingProvider uses one structured request and maps the complete JSON response", async () => {
  let calls = 0;
  const provider = new GeminiWritingProvider({
    apiKey: "test-key",
    client: {
      interactions: {
        async create(request) {
          calls += 1;
          assert.equal(request.model, "gemini-3.5-flash");
          assert.equal(request.response_format instanceof Object, true);
          return {
            output_text: JSON.stringify({
              grammar: { score: 7, grammarErrors: [], spellingErrors: [], punctuationErrors: [], suggestions: [] },
              taskAchievement: {
                score: 6.5,
                answeredQuestion: true,
                coveredAllParts: false,
                offTopic: false,
                relevanceScore: 0.8,
                missingPoints: ["Disadvantages"],
                feedback: "Only one side is developed.",
              },
              coherence: { score: 6, feedback: "Paragraphs are logical." },
              vocabulary: { score: 6.5, feedback: "Adequate range." },
              overallBand: 6.5,
              summary: "The essay addresses only advantages.",
              strengths: ["Clear examples."],
              weakAreas: ["Discuss both sides."],
              recommendations: ["Add a disadvantages paragraph."],
            }),
          };
        },
      },
    },
  });

  const result = await provider.analyze({
    essay: "There are several advantages to public transport.",
    taskNumber: 2,
    questionMetadata: { prompt: "Discuss both advantages and disadvantages." },
  });

  assert.equal(calls, 1);
  assert.equal(result.grammarResult.score, 7);
  assert.equal(result.essayAnalysis.coveredAllParts, false);
  assert.deepEqual(result.essayAnalysis.missingPoints, ["Disadvantages"]);
});

test("off-topic Gemini evidence caps task achievement and is exposed in the report", () => {
  const report = evaluateWriting({
    essay: "India is a beautiful country with many interesting places to visit.",
    taskNumber: 2,
    grammarResult,
    essayAnalysis: {
      ...essayAnalysis,
      taskAchievementScore: 8,
      answeredQuestion: false,
      coveredAllParts: false,
      offTopic: true,
      relevanceScore: 0.1,
      missingPoints: ["Nepal"],
    },
    questionMetadata: { prompt: "Write an essay about Nepal." },
    providerUsed: "Gemini",
  });

  assert.ok(report.taskAchievementScore <= 2);
  assert.equal(report.questionRelevance.offTopic, true);
  assert.equal(report.questionRelevance.answeredQuestion, false);
  assert.equal(report.providerUsed, "Gemini");
  assert.ok(report.weakAreas.includes("Essay does not address the question."));
});

test("local prompt relevance penalizes a substantive answer written about the wrong topic", () => {
  const report = evaluateWriting({
    essay: "Bananas are nutritious and popular around the world because they are affordable and easy to eat every day.",
    taskNumber: 2,
    grammarResult,
    essayAnalysis: {},
    questionMetadata: { prompt: "Write an essay about apples." },
  });

  assert.equal(report.questionRelevance.relevanceScore, 0);
  assert.equal(report.questionRelevance.offTopic, true);
  assert.equal(report.questionRelevance.answeredQuestion, false);
  assert.ok(report.taskAchievementScore <= 2);
  assert.ok(report.recommendations.some((recommendation) => recommendation.includes("exact question")));
});

test("local grammar fallback identifies spelling and punctuation issues for the report", async () => {
  const analysis = await new LocalGrammarProvider().analyze({
    essay: "This is definately a punction error ! It should end correctly",
    taskNumber: 2,
  });

  assert.ok(analysis.spellingErrors.some((issue) => issue.suggestion === "definitely"));
  assert.ok(analysis.spellingErrors.some((issue) => issue.suggestion === "punctuation"));
  assert.ok(analysis.punctuationErrors.some((issue) => issue.message.includes("Remove the space")));
  assert.ok(analysis.punctuationErrors.some((issue) => issue.message.includes("terminal punctuation")));
});

test("writing service falls back to local providers when Gemini fails", async () => {
  let completed: unknown;
  const repository: WritingEvaluationRepositoryPort = {
    async startSubmission() { return { id: "submission-fallback" }; },
    async completeSubmission(_id, result) { completed = result; return result; },
    async markFailed() { throw new Error("Fallback should complete the submission."); },
    async findSubmissionForUser() { return null; },
  };
  const providers: WritingProviders = {
    gemini: { async analyze() { throw new Error("Gemini timeout"); } },
    grammar: { async analyze() { return grammarResult; } },
    essayAnalysis: { async analyze() { return essayAnalysis; } },
  };

  await new WritingEvaluationService(repository, providers).submit("user-1", {
    mode: "task",
    tasks: [{ taskNumber: 1, essay: "Overall, the figure increased from 10% to 30%.", questionMetadata: { prompt: "Summarise the chart." } }],
  });

  const persisted = completed as { taskEvaluations: Array<{ report: { providerUsed: string } }> };
  assert.equal(persisted.taskEvaluations[0]?.report.providerUsed, "Local Fallback");
});
