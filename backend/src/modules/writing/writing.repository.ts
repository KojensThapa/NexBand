import { prisma } from "../../config/prisma";
import {
  type CreateWritingTestInput,
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
}
