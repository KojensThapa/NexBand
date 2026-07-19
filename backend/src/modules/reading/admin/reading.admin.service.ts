import { ReadingRepository } from "../reading.repository";
import type {
  CreateReadingMockTestInput,
  UpdateReadingMockTestInput,
} from "../reading.schemas";

type ReadingQuestionInput = CreateReadingMockTestInput["passages"][number]["questions"][number];

export class ReadingAdminServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "ReadingAdminServiceError";
  }
}

function toStringOptions(options: unknown): string[] | undefined {
  if (!Array.isArray(options) || !options.every((option) => typeof option === "string")) {
    return undefined;
  }
  return options;
}

export class ReadingAdminService {
  constructor(private readonly readingRepository = new ReadingRepository()) {}

  private validateMockTest(data: CreateReadingMockTestInput) {
    if (data.passages.length !== 3) {
      throw new ReadingAdminServiceError(
        "Reading mock test must contain exactly 3 passages.",
        400
      );
    }

    const passageNumbers = new Set(data.passages.map((passage) => passage.passageNumber));
    if (passageNumbers.size !== 3 || ![1, 2, 3].every((number) => passageNumbers.has(number))) {
      throw new ReadingAdminServiceError(
        "Reading mock test must contain passages 1, 2, and 3 exactly once.",
        400
      );
    }

    const usedQuestionNumbers = new Set<number>();
    let totalQuestions = 0;

    for (const passage of data.passages) {
      if (passage.questions.length === 0) {
        throw new ReadingAdminServiceError(
          `Passage ${passage.passageNumber} must contain at least one question.`,
          400
        );
      }

      totalQuestions += passage.questions.length;
      for (const question of passage.questions) {
        if (usedQuestionNumbers.has(question.questionNumber)) {
          throw new ReadingAdminServiceError(
            `Question number ${question.questionNumber} is duplicated.`,
            400
          );
        }
        usedQuestionNumbers.add(question.questionNumber);
      }
    }

    return totalQuestions;
  }

  async createMockTest(data: CreateReadingMockTestInput) {
    const totalQuestions = this.validateMockTest(data);
    return this.readingRepository.createMockTest({ ...data, totalQuestions });
  }

  async getAllMockTests() {
    return this.readingRepository.findAll();
  }

  async getMockTestById(id: string) {
    const test = await this.readingRepository.findById(id);
    if (!test) throw new ReadingAdminServiceError("Reading test not found.", 404);
    return test;
  }

  async deleteMockTest(id: string) {
    await this.getMockTestById(id);
    return this.readingRepository.delete(id);
  }

  async publishMockTest(id: string) {
    await this.getMockTestById(id);
    return this.readingRepository.publish(id);
  }

  async unpublishMockTest(id: string) {
    await this.getMockTestById(id);
    return this.readingRepository.unpublish(id);
  }

  async updateMockTest(id: string, data: UpdateReadingMockTestInput) {
    const existing = await this.getMockTestById(id);
    const next = {
      title: data.title ?? existing.title,
      tags: data.tags ?? existing.tags,
      duration: data.duration ?? existing.duration,
      passages: data.passages ?? existing.passages.map((passage) => ({
        passageNumber: passage.passageNumber,
        title: passage.title,
        instruction: passage.instruction ?? undefined,
        passageText: passage.passageText,
        imageUrl: passage.imageUrl ?? undefined,
        questions: passage.questions.map((question) => ({
          questionNumber: question.questionNumber,
          type: String(question.type) as ReadingQuestionInput["type"],
          questionText: question.questionText,
          options: toStringOptions(question.options),
          correctAnswer: question.correctAnswer,
          marks: question.marks,
          explanation: question.explanation ?? undefined,
        })),
      })),
    } satisfies CreateReadingMockTestInput;

    const totalQuestions = this.validateMockTest(next);
    return this.readingRepository.update(id, next, totalQuestions);
  }
}
