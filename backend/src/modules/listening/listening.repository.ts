import { prisma } from "../../config/prisma";
import {
  CreateListeningMockTestInput,
  toDatabaseListeningQuestionType,
} from "./listening.schemas";

const listeningMockTestInclude = {
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

function createParts(data: CreateListeningMockTestInput) {
  return data.parts.map((part) => ({
    partNumber: part.partNumber,
    title: part.title,
    instruction: part.instruction,
    transcript: part.transcript,
    audioStorageKey: part.audioStorageKey,
    audioUrl: part.audioUrl,
    audioDurationSeconds: part.audioDurationSeconds,
    mapImageUrl: part.mapImageUrl,
    mapImageAlt: part.mapImageAlt,
    questions: {
      create: part.questions.map((question) => ({
        questionNumber: question.questionNumber,
        type: toDatabaseListeningQuestionType(question.type),
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        marks: question.marks,
        explanation: question.explanation,
      })),
    },
  }));
}

export class ListeningRepository {
  async createMockTest(data: CreateListeningMockTestInput & { totalQuestions: number }) {
    return prisma.listeningMockTest.create({
      data: {
        title: data.title,
        iconStyle: data.iconStyle,
        isPublished: data.published ?? false,
        totalQuestions: data.totalQuestions,
        parts: {
          create: createParts(data),
        },
      },
      include: listeningMockTestInclude,
    });
  }

  async findAll() {
    return prisma.listeningMockTest.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: listeningMockTestInclude,
    });
  }

  async findById(id: string) {
    return prisma.listeningMockTest.findUnique({
      where: { id },
      include: listeningMockTestInclude,
    });
  }

  async update(
    id: string,
    data: CreateListeningMockTestInput,
    totalQuestions: number
  ) {
    return prisma.listeningMockTest.update({
      where: { id },
      data: {
        title: data.title,
        iconStyle: data.iconStyle,
        totalQuestions,
        ...(data.published === undefined ? {} : { isPublished: data.published }),
        parts: {
          deleteMany: {},
          create: createParts(data),
        },
      },
      include: listeningMockTestInclude,
    });
  }

  async delete(id: string) {
    return prisma.listeningMockTest.delete({
      where: { id },
    });
  }

  async publish(id: string) {
    return prisma.listeningMockTest.update({
      where: { id },
      data: {
        isPublished: true,
      },
      include: listeningMockTestInclude,
    });
  }

  async unpublish(id: string) {
    return prisma.listeningMockTest.update({
      where: { id },
      data: {
        isPublished: false,
      },
      include: listeningMockTestInclude,
    });
  }

  async findPublished(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [tests, total] = await Promise.all([
      prisma.listeningMockTest.findMany({
        where: {
          isPublished: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: listeningMockTestInclude,
      }),
      prisma.listeningMockTest.count({
        where: {
          isPublished: true,
        },
      }),
    ]);

    return { tests, total };
  }

  async findPublishedById(id: string) {
    return prisma.listeningMockTest.findFirst({
      where: {
        id,
        isPublished: true,
      },
      include: listeningMockTestInclude,
    });
  }
}
