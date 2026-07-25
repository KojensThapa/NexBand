import { ListeningAttemptStatus, Prisma } from "@prisma/client";

import { prisma } from "../../../config/prisma";
import type { ListeningAnswers } from "../listening.schemas";

/** The learner projection intentionally omits answer keys, explanations, and transcripts. */
const publishedListeningTestSelect = {
  id: true,
  title: true,
  iconStyle: true,
  totalQuestions: true,
  totalMinutes: true,
  bufferSeconds: true,
  createdAt: true,
} satisfies Prisma.ListeningMockTestSelect;

const publishedListeningTestDetailSelect = {
  id: true,
  title: true,
  iconStyle: true,
  totalQuestions: true,
  totalMinutes: true,
  bufferSeconds: true,
  parts: {
    orderBy: { partNumber: "asc" },
    select: {
      id: true,
      partNumber: true,
      title: true,
      instruction: true,
      audioUrl: true,
      audioDurationSeconds: true,
      mapImageUrl: true,
      mapImageAlt: true,
      questions: {
        orderBy: { questionNumber: "asc" },
        select: {
          id: true,
          questionNumber: true,
          type: true,
          questionText: true,
          options: true,
          marks: true,
        },
      },
    },
  },
} satisfies Prisma.ListeningMockTestSelect;

const listeningMockTestWithQuestionsInclude = {
  parts: {
    orderBy: { partNumber: "asc" as const },
    include: {
      questions: {
        orderBy: { questionNumber: "asc" as const },
      },
    },
  },
} satisfies Prisma.ListeningMockTestInclude;

const listeningAttemptSelect = {
  id: true,
  mockTestId: true,
  status: true,
  answers: true,
  startedAt: true,
  submittedAt: true,
  updatedAt: true,
} satisfies Prisma.ListeningAttemptSelect;

/** Only fully authored tests are visible to learners. */
const learnerReadyPublishedTestWhere = {
  isPublished: true,
  AND: [
    {
      parts: {
        every: {
          audioUrl: { not: null },
          questions: { some: {} },
        },
      },
    },
    ...([1, 2, 3, 4] as const).map((partNumber) => ({
      parts: {
        some: {
          partNumber,
          audioUrl: { not: null },
          questions: { some: {} },
        },
      },
    })),
  ],
} satisfies Prisma.ListeningMockTestWhereInput;

export type ListeningResultData = {
  correctAnswers: number;
  totalQuestions: number;
  rawScore: number;
  totalMarks: number;
  percentage: number;
  bandScore: number;
  algorithmVersion: string;
  report?: Prisma.InputJsonValue;
};

/** Persistence owned by the learner Listening attempt and result workflow. */
export class ListeningUserRepository {
  async findPublished(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [tests, total] = await Promise.all([
      prisma.listeningMockTest.findMany({
        where: learnerReadyPublishedTestWhere,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: publishedListeningTestSelect,
      }),
      prisma.listeningMockTest.count({ where: learnerReadyPublishedTestWhere }),
    ]);

    return { tests, total };
  }

  async findPublishedById(id: string) {
    return prisma.listeningMockTest.findFirst({
      where: { id, ...learnerReadyPublishedTestWhere },
      select: publishedListeningTestDetailSelect,
    });
  }

  async findPublishedAudioSource(id: string, partNumber: number) {
    return prisma.listeningPart.findFirst({
      where: {
        partNumber,
        mockTest: { id, ...learnerReadyPublishedTestWhere },
      },
      select: { audioUrl: true },
    });
  }

  async createAttempt(userId: string, mockTestId: string) {
    return prisma.listeningAttempt.create({
      data: { userId, mockTestId, answers: {} },
      select: listeningAttemptSelect,
    });
  }

  async findAttemptWithQuestions(userId: string, attemptId: string) {
    return prisma.listeningAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        result: true,
        mockTest: {
          include: listeningMockTestWithQuestionsInclude,
        },
      },
    });
  }

  async saveAnswers(userId: string, attemptId: string, answers: ListeningAnswers) {
    const updated = await prisma.listeningAttempt.updateMany({
      where: {
        id: attemptId,
        userId,
        status: ListeningAttemptStatus.IN_PROGRESS,
      },
      data: { answers: answers as Prisma.InputJsonValue },
    });

    if (updated.count === 0) return null;

    return prisma.listeningAttempt.findUnique({
      where: { id: attemptId },
      select: listeningAttemptSelect,
    });
  }

  async completeAttempt(
    userId: string,
    attemptId: string,
    answers: ListeningAnswers,
    resultData: ListeningResultData
  ) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.listeningAttempt.updateMany({
        where: {
          id: attemptId,
          userId,
          status: ListeningAttemptStatus.IN_PROGRESS,
        },
        data: {
          answers: answers as Prisma.InputJsonValue,
          status: ListeningAttemptStatus.SUBMITTED,
          submittedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        const submittedAttempt = await tx.listeningAttempt.findFirst({
          where: { id: attemptId, userId },
          include: { result: true },
        });
        return {
          attempt: submittedAttempt,
          result: submittedAttempt?.result ?? null,
          alreadySubmitted: true,
        };
      }

      const result = await tx.listeningResult.create({
        data: { attemptId, userId, ...resultData },
      });

      const attempt = await tx.listeningAttempt.findUnique({
        where: { id: attemptId },
        select: listeningAttemptSelect,
      });

      return { attempt, result, alreadySubmitted: false };
    });
  }

  async findResultForAttempt(userId: string, attemptId: string) {
    return prisma.listeningResult.findFirst({
      where: { attemptId, userId },
    });
  }
}
