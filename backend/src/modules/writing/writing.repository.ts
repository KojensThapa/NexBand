import { Prisma, WritingAttemptStatus } from "@prisma/client";

import { prisma } from "../../config/prisma";
import {
  type CreateWritingTestInput,
  type WritingEssayInput,
  toDatabaseWritingCategory,
  toDatabaseWritingTask1Type,
  type WritingCategoryInput,
} from "./writing.schemas";

const writingTestInclude = {
  tasks: {
    orderBy: {
      taskNumber: "asc" as const,
    },
  },
};

const learnerWritingTestSelect = {
  id: true,
  title: true,
  category: true,
  tasks: {
    orderBy: { taskNumber: "asc" },
    select: {
      id: true,
      taskNumber: true,
      title: true,
      prompt: true,
      typeLabel: true,
      task1Type: true,
      imageUrl: true,
      imageAlt: true,
    },
  },
} satisfies Prisma.WritingTestSelect;

const writingAttemptSelect = {
  id: true,
  testId: true,
  status: true,
  startedAt: true,
  submittedAt: true,
  updatedAt: true,
  essays: {
    orderBy: { task: { taskNumber: "asc" } },
    select: {
      id: true,
      taskId: true,
      content: true,
      wordCount: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.WritingAttemptSelect;

function countWords(content: string) {
  const normalized = content.trim();
  return normalized ? normalized.split(/\s+/).length : 0;
}

function createTasks(data: CreateWritingTestInput) {
  return data.tasks.map((task) => ({
    taskNumber: task.taskNumber,
    title: task.title,
    prompt: task.prompt,
    typeLabel: task.typeLabel,
    task1Type:
      task.task1Type === undefined
        ? null
        : toDatabaseWritingTask1Type(task.task1Type),
    imageUrl: task.imageUrl,
    imageAlt: task.imageAlt,
  }));
}

export class WritingRepository {
  async createTest(data: CreateWritingTestInput) {
    return prisma.writingTest.create({
      data: {
        title: data.title,
        category: toDatabaseWritingCategory(data.category),
        isPublished: data.published ?? false,
        tasks: {
          create: createTasks(data),
        },
      },
      include: writingTestInclude,
    });
  }

  async findAll() {
    return prisma.writingTest.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: writingTestInclude,
    });
  }

  async findById(id: string) {
    return prisma.writingTest.findUnique({
      where: { id },
      include: writingTestInclude,
    });
  }

  async update(id: string, data: CreateWritingTestInput) {
    return prisma.writingTest.update({
      where: { id },
      data: {
        title: data.title,
        category: toDatabaseWritingCategory(data.category),
        ...(data.published === undefined ? {} : { isPublished: data.published }),
        tasks: {
          deleteMany: {},
          create: createTasks(data),
        },
      },
      include: writingTestInclude,
    });
  }

  async delete(id: string) {
    return prisma.writingTest.delete({
      where: { id },
    });
  }

  async publish(id: string) {
    return prisma.writingTest.update({
      where: { id },
      data: { isPublished: true },
      include: writingTestInclude,
    });
  }

  async unpublish(id: string) {
    return prisma.writingTest.update({
      where: { id },
      data: { isPublished: false },
      include: writingTestInclude,
    });
  }

  async findPublished(
    page: number,
    limit: number,
    category?: WritingCategoryInput
  ) {
    const skip = (page - 1) * limit;
    const where = {
      isPublished: true,
      ...(category === undefined
        ? {}
        : { category: toDatabaseWritingCategory(category) }),
    };

    const [tests, total] = await Promise.all([
      prisma.writingTest.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: writingTestInclude,
      }),
      prisma.writingTest.count({ where }),
    ]);

    return { tests, total };
  }

  async findPublishedById(id: string) {
    return prisma.writingTest.findFirst({
      where: {
        id,
        isPublished: true,
      },
      include: writingTestInclude,
    });
  }

  async findPublishedByIdForLearner(id: string) {
    return prisma.writingTest.findFirst({
      where: {
        id,
        isPublished: true,
      },
      select: learnerWritingTestSelect,
    });
  }

  async findPublishedForLearners(
    page: number,
    limit: number,
    category?: WritingCategoryInput
  ) {
    const skip = (page - 1) * limit;
    const where = {
      isPublished: true,
      ...(category === undefined
        ? {}
        : { category: toDatabaseWritingCategory(category) }),
    };

    const [tests, total] = await Promise.all([
      prisma.writingTest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: learnerWritingTestSelect,
      }),
      prisma.writingTest.count({ where }),
    ]);

    return { tests, total };
  }

  async createAttempt(userId: string, testId: string) {
    return prisma.writingAttempt.create({
      data: { userId, testId },
      select: writingAttemptSelect,
    });
  }

  async findAttemptWithTest(userId: string, attemptId: string) {
    return prisma.writingAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        essays: true,
        test: {
          select: learnerWritingTestSelect,
        },
      },
    });
  }

  async saveDrafts(userId: string, attemptId: string, essays: WritingEssayInput[]) {
    return prisma.$transaction(async (tx) => {
      const attempt = await tx.writingAttempt.findFirst({
        where: { id: attemptId, userId },
        select: { id: true, status: true },
      });

      if (!attempt || attempt.status !== WritingAttemptStatus.DRAFT) return null;

      await Promise.all(
        essays.map((essay) =>
          tx.writingEssay.upsert({
            where: {
              attemptId_taskId: { attemptId, taskId: essay.taskId },
            },
            create: {
              attemptId,
              taskId: essay.taskId,
              content: essay.content,
              wordCount: countWords(essay.content),
            },
            update: {
              content: essay.content,
              wordCount: countWords(essay.content),
            },
          })
        )
      );

      return tx.writingAttempt.findUnique({
        where: { id: attemptId },
        select: writingAttemptSelect,
      });
    });
  }

  async submitForAnalysis(
    userId: string,
    attemptId: string,
    essays: WritingEssayInput[]
  ) {
    return prisma.$transaction(async (tx) => {
      const attempt = await tx.writingAttempt.findFirst({
        where: { id: attemptId, userId },
        select: { id: true, status: true },
      });

      if (!attempt) return { attempt: null, alreadySubmitted: false };

      if (attempt.status === WritingAttemptStatus.PENDING_ANALYSIS) {
        const existing = await tx.writingAttempt.findUnique({
          where: { id: attemptId },
          select: writingAttemptSelect,
        });
        return { attempt: existing, alreadySubmitted: true };
      }

      await Promise.all(
        essays.map((essay) =>
          tx.writingEssay.upsert({
            where: {
              attemptId_taskId: { attemptId, taskId: essay.taskId },
            },
            create: {
              attemptId,
              taskId: essay.taskId,
              content: essay.content,
              wordCount: countWords(essay.content),
            },
            update: {
              content: essay.content,
              wordCount: countWords(essay.content),
            },
          })
        )
      );

      const submitted = await tx.writingAttempt.update({
        where: { id: attemptId },
        data: {
          status: WritingAttemptStatus.PENDING_ANALYSIS,
          submittedAt: new Date(),
        },
        select: writingAttemptSelect,
      });

      return { attempt: submitted, alreadySubmitted: false };
    });
  }
}
