import { prisma } from "../../config/prisma";
import { CreateReadingMockTestInput } from "./reading.schemas";

export class ReadingRepository {
 async createMockTest(
    data: CreateReadingMockTestInput & { totalQuestions: number }
    ) {
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
      include: {
        passages: {
          include: {
            questions: true,
          },
        },
      },
    });
  }

  async findAll() {
    return prisma.readingMockTest.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string) {
    return prisma.readingMockTest.findUnique({
      where: { id },
      include: {
        passages: {
          include: {
            questions: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.readingMockTest.delete({
      where: { id },
    });
  }

  async publish(id: string) {
    return prisma.readingMockTest.update({
      where: { id },
      data: {
        isPublished: true,
      },
    });
  }

  async unpublish(id: string) {
    return prisma.readingMockTest.update({
      where: { id },
      data: {
        isPublished: false,
      },
    });
  }

  // update mock test
  async update(
  id: string,
  data: CreateReadingMockTestInput,
  totalQuestions: number
) {
  // Delete old passages and questions
  await prisma.readingPassage.deleteMany({
    where: {
      mockTestId: id,
    },
  });

  return prisma.readingMockTest.update({
    where: {
      id,
    },

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

    include: {
      passages: {
        include: {
          questions: true,
        },
      },
    },
  });
}

async findPublished(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [tests, total] = await Promise.all([
    prisma.readingMockTest.findMany({
      where: {
        isPublished: true,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        passages: {
          include: {
            questions: true,
          },
        },
      },
    }),

    prisma.readingMockTest.count({
      where: {
        isPublished: true,
      },
    }),
  ]);

  return {
    tests,
    total,
  };
}

async findPublishedById(id: string) {
  return prisma.readingMockTest.findFirst({
    where: {
      id,
      isPublished: true,
    },
    include: {
      passages: {
        include: {
          questions: true,
        },
      },
    },
  });
}

}