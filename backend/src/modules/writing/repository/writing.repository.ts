import {
  Prisma,
  WritingReportScope,
  WritingSubmissionMode,
  WritingSubmissionStatus,
} from "@prisma/client";

import { prisma } from "../../../config/prisma";
import type {
  GrammarResult,
  WritingEvaluationResult,
  WritingMockReport,
  WritingProviderUsed,
} from "../algorithm/types";
import type { CreateWritingSubmissionInput } from "../writing.schemas";

export interface StartedWritingSubmission {
  id: string;
}

export interface WritingTaskProviderData {
  taskId?: string;
  taskNumber: 1 | 2;
  essay: string;
  grammarResult: GrammarResult;
  essayAnalysis: unknown;
  providerUsed: WritingProviderUsed;
  evaluationTimeMs: number;
  report: WritingEvaluationResult;
}

export interface CompletedWritingSubmission {
  taskEvaluations: WritingTaskProviderData[];
  mockReport?: WritingMockReport;
}

export interface WritingEvaluationRepositoryPort {
  startSubmission(userId: string, input: CreateWritingSubmissionInput): Promise<StartedWritingSubmission>;
  completeSubmission(submissionId: string, result: CompletedWritingSubmission): Promise<unknown>;
  markFailed(submissionId: string, message: string): Promise<void>;
  findSubmissionForUser(userId: string, submissionId: string): Promise<unknown>;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function taskReportData(report: WritingEvaluationResult) {
  return {
    reportKey: `task-${report.taskNumber}`,
    scope: WritingReportScope.TASK,
    status: WritingSubmissionStatus.COMPLETED,
    taskNumber: report.taskNumber,
    wordCount: report.wordCount,
    uniqueWords: report.uniqueWords,
    repeatedWords: toJson(report.repeatedWords),
    grammarScore: report.grammarScore,
    vocabularyScore: report.vocabularyScore,
    taskAchievementScore: report.taskAchievementScore,
    coherenceScore: report.coherenceScore,
    overallBand: report.overallBand,
    cefrLevel: report.cefrLevel,
    grammarErrors: toJson(report.grammarErrors),
    spellingErrors: toJson(report.spellingErrors),
    punctuationErrors: toJson(report.punctuationErrors),
    strengths: toJson(report.strengths),
    weakAreas: toJson(report.weakAreas),
    recommendations: toJson(report.recommendations),
    evaluationData: toJson(report),
    algorithmVersion: report.algorithmVersion,
  };
}

function mockReportData(report: WritingMockReport) {
  return {
    reportKey: "mock",
    scope: WritingReportScope.MOCK,
    status: WritingSubmissionStatus.COMPLETED,
    taskNumber: null,
    wordCount: report.wordCount,
    uniqueWords: report.uniqueWords,
    repeatedWords: toJson(report.repeatedWords),
    grammarScore: report.grammarScore,
    vocabularyScore: report.vocabularyScore,
    taskAchievementScore: report.taskAchievementScore,
    coherenceScore: report.coherenceScore,
    overallBand: report.overallBand,
    cefrLevel: report.cefrLevel,
    grammarErrors: toJson(report.grammarErrors),
    spellingErrors: toJson(report.spellingErrors),
    punctuationErrors: toJson(report.punctuationErrors),
    strengths: toJson(report.strengths),
    weakAreas: toJson(report.weakAreas),
    recommendations: toJson(report.recommendations),
    evaluationData: toJson(report),
    algorithmVersion: report.algorithmVersion,
  };
}

/** Prisma persistence adapter. The service is the only layer that calls providers. */
export class WritingEvaluationRepository implements WritingEvaluationRepositoryPort {
  async startSubmission(userId: string, input: CreateWritingSubmissionInput): Promise<StartedWritingSubmission> {
    return prisma.writingSubmission.create({
      data: {
        userId,
        ...(input.testId ? { testId: input.testId } : {}),
        ...(input.attemptId ? { attemptId: input.attemptId } : {}),
        mode: input.mode === "mock" ? WritingSubmissionMode.MOCK : WritingSubmissionMode.TASK,
        status: WritingSubmissionStatus.PROCESSING,
      },
      select: { id: true },
    });
  }

  async completeSubmission(submissionId: string, result: CompletedWritingSubmission): Promise<unknown> {
    return prisma.writingSubmission.update({
      where: { id: submissionId },
      data: {
        status: WritingSubmissionStatus.COMPLETED,
        evaluations: {
          create: result.taskEvaluations.map((evaluation) => ({
            ...(evaluation.taskId ? { taskId: evaluation.taskId } : {}),
            taskNumber: evaluation.taskNumber,
            essay: evaluation.essay,
            wordCount: evaluation.report.wordCount,
            uniqueWords: evaluation.report.uniqueWords,
            repeatedWords: toJson(evaluation.report.repeatedWords),
            grammarScore: evaluation.report.grammarScore,
            vocabularyScore: evaluation.report.vocabularyScore,
            taskAchievementScore: evaluation.report.taskAchievementScore,
            coherenceScore: evaluation.report.coherenceScore,
            grammarErrors: toJson(evaluation.grammarResult.grammarErrors),
            spellingErrors: toJson(evaluation.grammarResult.spellingErrors),
            punctuationErrors: toJson(evaluation.grammarResult.punctuationErrors),
            grammarSuggestions: toJson(evaluation.grammarResult.suggestions),
            providerData: toJson({
              essayAnalysis: evaluation.essayAnalysis,
              providerUsed: evaluation.providerUsed,
              evaluationTimeMs: evaluation.evaluationTimeMs,
            }),
          })),
        },
        reports: {
          create: [
            ...result.taskEvaluations.map((evaluation) => taskReportData(evaluation.report)),
            ...(result.mockReport ? [mockReportData(result.mockReport)] : []),
          ],
        },
      },
      include: {
        user: { select: { id: true, fullName: true } },
        evaluations: { orderBy: { taskNumber: "asc" } },
        reports: { orderBy: [{ scope: "asc" }, { taskNumber: "asc" }] },
      },
    });
  }

  async markFailed(submissionId: string, message: string): Promise<void> {
    await prisma.writingSubmission.updateMany({
      where: { id: submissionId, status: WritingSubmissionStatus.PROCESSING },
      data: { status: WritingSubmissionStatus.FAILED, errorMessage: message.slice(0, 4_000) },
    });
  }

  async findSubmissionForUser(userId: string, submissionId: string): Promise<unknown> {
    return prisma.writingSubmission.findFirst({
      where: { id: submissionId, userId },
      include: {
        user: { select: { id: true, fullName: true } },
        evaluations: { orderBy: { taskNumber: "asc" } },
        reports: { orderBy: [{ scope: "asc" }, { taskNumber: "asc" }] },
      },
    });
  }
}
