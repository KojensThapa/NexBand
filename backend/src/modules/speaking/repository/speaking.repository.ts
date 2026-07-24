import {
  Prisma,
  SpeakingReportScope,
  SpeakingSubmissionMode,
  SpeakingSubmissionStatus,
} from "@prisma/client";

import { prisma } from "../../../config/prisma";
import type { SpeakingEvaluationResult } from "../algorithm/types";
import type { CreateSpeakingSubmissionInput } from "../speaking.schemas";

export interface StartedSpeakingSubmission {
  id: string;
  recordings: Array<{ id: string; responseKey: string; partNumber: number }>;
}

export interface RecordingProviderEvaluation {
  recordingId: string;
  partNumber: number;
  transcript: string;
  grammarScore: number;
  pronunciationScore: number;
  pronunciationConfidence: number;
  grammarErrors: unknown;
  grammarSuggestions: string[];
  mispronouncedWords: unknown;
  speechToTextConfidence?: number;
}

export interface CompletedSpeakingSubmission {
  recordingEvaluations: RecordingProviderEvaluation[];
  partReports: SpeakingEvaluationResult[];
  mockReport?: SpeakingEvaluationResult;
}

export interface SpeakingEvaluationRepositoryPort {
  startSubmission(userId: string, input: CreateSpeakingSubmissionInput): Promise<StartedSpeakingSubmission>;
  completeSubmission(submissionId: string, result: CompletedSpeakingSubmission): Promise<unknown>;
  markFailed(submissionId: string, message: string): Promise<void>;
  findSubmissionForUser(userId: string, submissionId: string): Promise<unknown>;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function reportData(report: SpeakingEvaluationResult, scope: SpeakingReportScope) {
  return {
    reportKey: report.partNumber === "mock" ? "mock" : `part-${report.partNumber}`,
    scope,
    status: SpeakingSubmissionStatus.COMPLETED,
    partNumber: typeof report.partNumber === "number" ? report.partNumber : null,
    transcript: report.transcript,
    durationSeconds: report.duration,
    wordsPerMinute: report.wordsPerMinute,
    fluencyScore: report.fluencyScore,
    vocabularyScore: report.vocabularyScore,
    grammarScore: report.grammarScore,
    pronunciationScore: report.pronunciationScore,
    overallBand: report.overallBand,
    cefrLevel: report.cefrLevel,
    fillerWords: toJson(report.fillerWords),
    mispronouncedWords: toJson(report.mispronouncedWords),
    strengths: toJson(report.strengths),
    weakAreas: toJson(report.weakAreas),
    recommendations: toJson(report.recommendations),
    evaluationData: toJson(report),
    algorithmVersion: report.algorithmVersion,
  };
}

/** Prisma implementation; all provider calls remain in the service layer. */
export class SpeakingEvaluationRepository implements SpeakingEvaluationRepositoryPort {
  async startSubmission(userId: string, input: CreateSpeakingSubmissionInput): Promise<StartedSpeakingSubmission> {
    return prisma.speakingSubmission.create({
      data: {
        userId,
        ...(input.testId ? { testId: input.testId } : {}),
        ...(input.attemptId ? { attemptId: input.attemptId } : {}),
        mode: input.mode === "mock" ? SpeakingSubmissionMode.MOCK : SpeakingSubmissionMode.PART,
        status: SpeakingSubmissionStatus.PROCESSING,
        recordings: {
          create: input.parts.flatMap((part) =>
            part.recordings.map((recording) => ({
              responseKey: recording.responseKey,
              partNumber: part.partNumber,
              ...(recording.audioUrl ? { audioUrl: recording.audioUrl } : {}),
              ...(recording.audioStorageKey ? { audioStorageKey: recording.audioStorageKey } : {}),
              ...(recording.mimeType ? { mimeType: recording.mimeType } : {}),
              ...(recording.transcript ? { transcript: recording.transcript } : {}),
              durationSeconds: recording.durationSeconds,
            }))
          ),
        },
      },
      select: {
        id: true,
        recordings: { select: { id: true, responseKey: true, partNumber: true } },
      },
    });
  }

  async completeSubmission(submissionId: string, result: CompletedSpeakingSubmission): Promise<unknown> {
    return prisma.speakingSubmission.update({
      where: { id: submissionId },
      data: {
        status: SpeakingSubmissionStatus.COMPLETED,
        evaluations: {
          create: result.recordingEvaluations.map((evaluation) => ({
            recordingId: evaluation.recordingId,
            partNumber: evaluation.partNumber,
            transcript: evaluation.transcript,
            grammarScore: evaluation.grammarScore,
            pronunciationScore: evaluation.pronunciationScore,
            pronunciationConfidence: evaluation.pronunciationConfidence,
            grammarErrors: toJson(evaluation.grammarErrors),
            grammarSuggestions: toJson(evaluation.grammarSuggestions),
            mispronouncedWords: toJson(evaluation.mispronouncedWords),
            ...(evaluation.speechToTextConfidence === undefined
              ? {}
              : { providerData: toJson({ speechToTextConfidence: evaluation.speechToTextConfidence }) }),
          })),
        },
        reports: {
          create: [
            ...result.partReports.map((report) => reportData(report, SpeakingReportScope.PART)),
            ...(result.mockReport ? [reportData(result.mockReport, SpeakingReportScope.MOCK)] : []),
          ],
        },
      },
      include: {
        recordings: { orderBy: [{ partNumber: "asc" }, { responseKey: "asc" }] },
        reports: { orderBy: [{ scope: "asc" }, { partNumber: "asc" }] },
      },
    });
  }

  async markFailed(submissionId: string, message: string): Promise<void> {
    await prisma.speakingSubmission.updateMany({
      where: { id: submissionId, status: SpeakingSubmissionStatus.PROCESSING },
      data: { status: SpeakingSubmissionStatus.FAILED, errorMessage: message.slice(0, 4_000) },
    });
  }

  async findSubmissionForUser(userId: string, submissionId: string): Promise<unknown> {
    return prisma.speakingSubmission.findFirst({
      where: { id: submissionId, userId },
      include: {
        recordings: { orderBy: [{ partNumber: "asc" }, { responseKey: "asc" }] },
        reports: { orderBy: [{ scope: "asc" }, { partNumber: "asc" }] },
      },
    });
  }
}

