import { prisma } from "../../config/prisma";
import {
  type CreateSpeakingMockTestInput,
  toDatabaseSpeakingCategory,
  type SpeakingCategoryInput,
} from "./speaking.schemas";

const speakingMockTestInclude = {
  parts: {
    orderBy: {
      partNumber: "asc" as const,
    },
    include: {
      questions: {
        orderBy: {
          questionNumber: "asc" as const,
        },
      },
    },
  },
};

function createQuestions(questions: CreateSpeakingMockTestInput["part1"]["questions"]) {
  return questions.map((question, index) => ({
    questionNumber: index + 1,
    text: question.text,
  }));
}

function createParts(data: CreateSpeakingMockTestInput) {
  return [
    {
      partNumber: 1,
      questions: {
        create: createQuestions(data.part1.questions),
      },
    },
    {
      partNumber: 2,
      cueCardTitle: data.part2.cueCardTitle || null,
      cueCardDescription: data.part2.cueCardDescription || null,
      bulletPoints: data.part2.bulletPoints,
      closingQuestion: data.part2.closingQuestion || null,
      preparationMinutes: data.part2.preparationMinutes,
      speakingMinutes: data.part2.speakingMinutes,
    },
    {
      partNumber: 3,
      topic: data.part3.topic || null,
      questions: {
        create: createQuestions(data.part3.questions),
      },
    },
  ];
}

export class SpeakingRepository {
  async createMockTest(data: CreateSpeakingMockTestInput) {
    return prisma.speakingMockTest.create({
      data: {
        title: data.title,
        category: toDatabaseSpeakingCategory(data.category),
        isPublished: data.published ?? false,
        parts: {
          create: createParts(data),
        },
      },
      include: speakingMockTestInclude,
    });
  }

  async findAll() {
    return prisma.speakingMockTest.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: speakingMockTestInclude,
    });
  }

  async findById(id: string) {
    return prisma.speakingMockTest.findUnique({
      where: { id },
      include: speakingMockTestInclude,
    });
  }

  async update(id: string, data: CreateSpeakingMockTestInput) {
    return prisma.speakingMockTest.update({
      where: { id },
      data: {
        title: data.title,
        category: toDatabaseSpeakingCategory(data.category),
        ...(data.published === undefined ? {} : { isPublished: data.published }),
        parts: {
          deleteMany: {},
          create: createParts(data),
        },
      },
      include: speakingMockTestInclude,
    });
  }

  async delete(id: string) {
    return prisma.speakingMockTest.delete({
      where: { id },
    });
  }

  async publish(id: string) {
    return prisma.speakingMockTest.update({
      where: { id },
      data: { isPublished: true },
      include: speakingMockTestInclude,
    });
  }

  async unpublish(id: string) {
    return prisma.speakingMockTest.update({
      where: { id },
      data: { isPublished: false },
      include: speakingMockTestInclude,
    });
  }

  async findPublished(
    page: number,
    limit: number,
    category?: SpeakingCategoryInput
  ) {
    const skip = (page - 1) * limit;
    const where = {
      isPublished: true,
      ...(category === undefined
        ? {}
        : { category: toDatabaseSpeakingCategory(category) }),
    };

    const [tests, total] = await Promise.all([
      prisma.speakingMockTest.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: speakingMockTestInclude,
      }),
      prisma.speakingMockTest.count({ where }),
    ]);

    return { tests, total };
  }

  async findPublishedById(id: string) {
    return prisma.speakingMockTest.findFirst({
      where: {
        id,
        isPublished: true,
      },
      include: speakingMockTestInclude,
    });
  }
}
