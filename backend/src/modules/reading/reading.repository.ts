import { Prisma, ReadingAttemptStatus } from "@prisma/client";

import { prisma } from "../../config/prisma";
import type { CreateReadingMockTestInput, ReadingAnswers } from "./reading.schemas";

const readingMockTestInclude = {
  passages: {
    orderBy: { passageNumber: "asc" },
    include: {
      questions: {
        orderBy: { questionNumber: "asc" },
      },
    },
  },
} satisfies Prisma.ReadingMockTestInclude;

const publicReadingMockTestSelect = {
  id: true,
  title: true,
  tags: true,
  duration: true,
  totalQuestions: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ReadingMockTestSelect;

const publicReadingMockTestDetailSelect = {
  ...publicReadingMockTestSelect,
  passages: {
    orderBy: { passageNumber: "asc" },
    select: {
      id: true,
      passageNumber: true,
      title: true,
      instruction: true,
      passageText: true,
      imageUrl: true,
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
} satisfies Prisma.ReadingMockTestSelect;

type ReadingResultData = {
  correctAnswers: number;
  totalQuestions: number;
  rawScore: number;
  totalMarks: number;
  percentage: number;
  bandScore: number;
  algorithmVersion: string;
  report: Prisma.InputJsonValue;
};

export class ReadingRepository {
  async createMockTest(data: CreateReadingMockTestInput & { totalQuestions: number }) {
    return prisma.readingMockTest.create({
      data: {
        title: data.title,
        tags: data.tags,
        duration: data.duration,
        totalQuestions: data.totalQuestions,
        passages: {
          create: data.passages.map((passage) => ({
            passageNumber: passage.passageNumber,
            title: passage.title,
            instruction: passage.instruction,
            passageText: passage.passageText,
            imageUrl: passage.imageUrl,
            questions: {
              create: passage.questions.map((question) => ({
                questionNumber: question.questionNumber,
                type: question.type,
                questionText: question.questionText,
                options: question.options,
                correctAnswer: question.correctAnswer,
                marks: question.marks,
                explanation: question.explanation,
              })),
            },
          })),
        },
      },
      include: readingMockTestInclude,
    });
  }

  async findAll() {
    return prisma.readingMockTest.findMany({
      orderBy: { createdAt: "desc" },
      include: readingMockTestInclude,
    });
  }

  async findById(id: string) {
    return prisma.readingMockTest.findUnique({
      where: { id },
      include: readingMockTestInclude,
    });
  }

  async delete(id: string) {
    return prisma.readingMockTest.delete({ where: { id } });
  }

  async publish(id: string) {
    return prisma.readingMockTest.update({
      where: { id },
      data: { isPublished: true },
      include: readingMockTestInclude,
    });
  }

  async unpublish(id: string) {
    return prisma.readingMockTest.update({
      where: { id },
      data: { isPublished: false },
      include: readingMockTestInclude,
    });
  }

  async update(id: string, data: CreateReadingMockTestInput, totalQuestions: number) {
    return prisma.$transaction(async (tx) => {
      await tx.readingPassage.deleteMany({ where: { mockTestId: id } });

      return tx.readingMockTest.update({
        where: { id },
        data: {
          title: data.title,
          tags: data.tags,
          duration: data.duration,
          totalQuestions,
          passages: {
            create: data.passages.map((passage) => ({
              passageNumber: passage.passageNumber,
              title: passage.title,
              instruction: passage.instruction,
              passageText: passage.passageText,
              imageUrl: passage.imageUrl,
              questions: {
                create: passage.questions.map((question) => ({
                  questionNumber: question.questionNumber,
                  type: question.type,
                  questionText: question.questionText,
                  options: question.options,
                  correctAnswer: question.correctAnswer,
                  marks: question.marks,
                  explanation: question.explanation,
                })),
              },
            })),
          },
        },
        include: readingMockTestInclude,
      });
    });
  }

  async findPublished(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [tests, total] = await Promise.all([
      prisma.readingMockTest.findMany({
        where: { isPublished: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: publicReadingMockTestSelect,
      }),
      prisma.readingMockTest.count({ where: { isPublished: true } }),
    ]);

    return { tests, total };
  }

  async findPublishedById(id: string) {
    return prisma.readingMockTest.findFirst({
      where: { id, isPublished: true },
      select: publicReadingMockTestDetailSelect,
    });
  }

  async createAttempt(userId: string, mockTestId: string) {
    return prisma.readingAttempt.create({
      data: {
        userId,
        mockTestId,
        answers: {},
      },
      select: {
        id: true,
        mockTestId: true,
        status: true,
        answers: true,
        startedAt: true,
        submittedAt: true,
        updatedAt: true,
      },
    });
  }

  async findAttemptWithQuestions(userId: string, attemptId: string) {
    return prisma.readingAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        result: true,
        mockTest: {
          include: readingMockTestInclude,
        },
      },
    });
  }

  async saveAnswers(userId: string, attemptId: string, answers: ReadingAnswers) {
    const updated = await prisma.readingAttempt.updateMany({
      where: {
        id: attemptId,
        userId,
        status: ReadingAttemptStatus.IN_PROGRESS,
      },
      data: { answers: answers as Prisma.InputJsonValue },
    });

    if (updated.count === 0) return null;

    return prisma.readingAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        mockTestId: true,
        status: true,
        answers: true,
        startedAt: true,
        submittedAt: true,
        updatedAt: true,
      },
    });
  }

  async completeAttempt(
    userId: string,
    attemptId: string,
    answers: ReadingAnswers,
    resultData: ReadingResultData
  ) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.readingAttempt.updateMany({
        where: {
          id: attemptId,
          userId,
          status: ReadingAttemptStatus.IN_PROGRESS,
        },
        data: {
          answers: answers as Prisma.InputJsonValue,
          status: ReadingAttemptStatus.SUBMITTED,
          submittedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        const submittedAttempt = await tx.readingAttempt.findFirst({
          where: { id: attemptId, userId },
          include: { result: true },
        });

        return {
          attempt: submittedAttempt,
          result: submittedAttempt?.result ?? null,
          alreadySubmitted: true,
        };
      }

      const result = await tx.readingResult.create({
        data: {
          attemptId,
          userId,
          ...resultData,
        },
      });

      const attempt = await tx.readingAttempt.findUnique({
        where: { id: attemptId },
      });

      return { attempt, result, alreadySubmitted: false };
    });
  }

  async findResultForAttempt(userId: string, attemptId: string) {
    return prisma.readingResult.findFirst({
      where: {
        attemptId,
        userId,
      },
    });
  }
}
