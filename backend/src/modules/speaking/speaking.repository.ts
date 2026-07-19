import {
  Prisma,
  SpeakingAttemptStatus,
  SpeakingCategory as PrismaSpeakingCategory,
  SpeakingEvaluationMode,
} from "@prisma/client";

import { prisma } from "../../config/prisma";
import type {
  CreateSpeakingTestInput,
  SpeakingCategory,
  SpeakingRecordings,
} from "./speaking.schemas";

const speakingTestInclude = {
  parts: {
    orderBy: { partNumber: "asc" },
    include: {
      questions: { orderBy: { questionNumber: "asc" } },
    },
  },
} satisfies Prisma.SpeakingTestInclude;

const publicSpeakingTestSelect = {
  id: true,
  title: true,
  category: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SpeakingTestSelect;

const publicSpeakingTestDetailSelect = {
  ...publicSpeakingTestSelect,
  parts: {
    orderBy: { partNumber: "asc" },
    select: {
      id: true,
      partNumber: true,
      cueCardTitle: true,
      cueCardDescription: true,
      bulletPoints: true,
      closingQuestion: true,
      preparationMinutes: true,
      speakingMinutes: true,
      durationMinutes: true,
      topic: true,
      questions: {
        orderBy: { questionNumber: "asc" },
        select: { id: true, questionNumber: true, text: true },
      },
    },
  },
} satisfies Prisma.SpeakingTestSelect;

type SpeakingEvaluationData = {
  recordingCount: number;
  totalQuestions: number;
  totalDurationSeconds: number;
  completionPercentage: number;
  basicScore: number;
  estimatedBandScore: number;
  evaluationMode: "BASIC";
  algorithmVersion: string;
  feedback: Prisma.InputJsonValue;
};

function toPrismaCategory(category: SpeakingCategory): PrismaSpeakingCategory {
  switch (category) {
    case "mock":
      return PrismaSpeakingCategory.MOCK;
    case "part-1":
      return PrismaSpeakingCategory.PART_1;
    case "part-2":
      return PrismaSpeakingCategory.PART_2;
    case "part-3":
      return PrismaSpeakingCategory.PART_3;
  }
}

function buildParts(data: CreateSpeakingTestInput) {
  return [
    {
      partNumber: 1,
      durationMinutes: data.part1.durationMinutes,
      questions: {
        create: data.part1.questions.map((question, index) => ({
          questionNumber: index + 1,
          text: question.text,
        })),
      },
    },
    {
      partNumber: 2,
      cueCardTitle: data.part2.cueCardTitle || null,
      cueCardDescription: data.part2.cueCardDescription || null,
      bulletPoints: data.part2.bulletPoints.filter(Boolean),
      closingQuestion: data.part2.closingQuestion || null,
      preparationMinutes: data.part2.preparationMinutes,
      speakingMinutes: data.part2.speakingMinutes,
    },
    {
      partNumber: 3,
      durationMinutes: data.part3.durationMinutes,
      topic: data.part3.topic || null,
      questions: {
        create: data.part3.questions.map((question, index) => ({
          questionNumber: index + 1,
          text: question.text,
        })),
      },
    },
  ];
}

export class SpeakingRepository {
  async createTest(data: CreateSpeakingTestInput) {
    return prisma.speakingTest.create({
      data: {
        title: data.title,
        category: toPrismaCategory(data.category),
        parts: { create: buildParts(data) },
      },
      include: speakingTestInclude,
    });
  }

  async findAll() {
    return prisma.speakingTest.findMany({
      orderBy: { createdAt: "desc" },
      include: speakingTestInclude,
    });
  }

  async findById(id: string) {
    return prisma.speakingTest.findUnique({
      where: { id },
      include: speakingTestInclude,
    });
  }

  async update(id: string, data: CreateSpeakingTestInput) {
    return prisma.$transaction(async (tx) => {
      await tx.speakingPart.deleteMany({ where: { testId: id } });
      return tx.speakingTest.update({
        where: { id },
        data: {
          title: data.title,
          category: toPrismaCategory(data.category),
          parts: { create: buildParts(data) },
        },
        include: speakingTestInclude,
      });
    });
  }

  async delete(id: string) {
    return prisma.speakingTest.delete({ where: { id } });
  }

  async setPublished(id: string, isPublished: boolean) {
    return prisma.speakingTest.update({
      where: { id },
      data: { isPublished },
      include: speakingTestInclude,
    });
  }

  async findPublished(category: SpeakingCategory | undefined, page: number, limit: number) {
    const where: Prisma.SpeakingTestWhereInput = {
      isPublished: true,
      ...(category ? { category: toPrismaCategory(category) } : {}),
    };
    const skip = (page - 1) * limit;
    const [tests, total] = await Promise.all([
      prisma.speakingTest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: publicSpeakingTestSelect,
      }),
      prisma.speakingTest.count({ where }),
    ]);
    return { tests, total };
  }

  async findPublishedById(id: string) {
    return prisma.speakingTest.findFirst({
      where: { id, isPublished: true },
      select: publicSpeakingTestDetailSelect,
    });
  }

  async createAttempt(userId: string, testId: string) {
    return prisma.speakingAttempt.create({
      data: { userId, testId, recordings: {} },
      select: {
        id: true,
        testId: true,
        status: true,
        recordings: true,
        startedAt: true,
        submittedAt: true,
        updatedAt: true,
      },
    });
  }

  async findAttemptWithContent(userId: string, attemptId: string) {
    return prisma.speakingAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        result: true,
        test: { include: speakingTestInclude },
      },
    });
  }

  async saveRecordings(userId: string, attemptId: string, recordings: SpeakingRecordings) {
    const updated = await prisma.speakingAttempt.updateMany({
      where: { id: attemptId, userId, status: SpeakingAttemptStatus.IN_PROGRESS },
      data: { recordings: recordings as Prisma.InputJsonValue },
    });
    if (updated.count === 0) return null;

    return prisma.speakingAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        testId: true,
        status: true,
        recordings: true,
        startedAt: true,
        submittedAt: true,
        updatedAt: true,
      },
    });
  }

  async completeAttempt(
    userId: string,
    attemptId: string,
    recordings: SpeakingRecordings,
    evaluation: SpeakingEvaluationData
  ) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.speakingAttempt.updateMany({
        where: { id: attemptId, userId, status: SpeakingAttemptStatus.IN_PROGRESS },
        data: {
          recordings: recordings as Prisma.InputJsonValue,
          status: SpeakingAttemptStatus.SUBMITTED,
          submittedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        const submittedAttempt = await tx.speakingAttempt.findFirst({
          where: { id: attemptId, userId },
          include: { result: true },
        });
        return {
          attempt: submittedAttempt,
          result: submittedAttempt?.result ?? null,
          alreadySubmitted: true,
        };
      }

      const result = await tx.speakingResult.create({
        data: {
          attemptId,
          userId,
          ...evaluation,
          evaluationMode: SpeakingEvaluationMode.BASIC,
        },
      });
      const attempt = await tx.speakingAttempt.findUnique({ where: { id: attemptId } });
      return { attempt, result, alreadySubmitted: false };
    });
  }

  async findResultForAttempt(userId: string, attemptId: string) {
    return prisma.speakingResult.findFirst({ where: { userId, attemptId } });
  }
}
