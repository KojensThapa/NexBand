import { ReadingRepository } from "./reading.repository";
import { CreateReadingMockTestInput } from "./reading.schemas";

export class ReadingService {
  private readingRepository = new ReadingRepository();

  async createMockTest(data: CreateReadingMockTestInput) {
  if (data.passages.length !== 3) {
    throw new Error("Reading mock test must contain exactly 3 passages.");
  }

  let totalQuestions = 0;

  const usedQuestionNumbers = new Set<number>();

  for (const passage of data.passages) {

    if (passage.questions.length === 0) {
      throw new Error(
        `Passage ${passage.passageNumber} must contain at least one question.`
      );
    }

    totalQuestions += passage.questions.length;

    for (const question of passage.questions) {

      if (usedQuestionNumbers.has(question.questionNumber)) {
        throw new Error(
          `Question number ${question.questionNumber} is duplicated.`
        );
      }

      usedQuestionNumbers.add(question.questionNumber);
    }
  }

    return this.readingRepository.createMockTest({
        ...data, 
        totalQuestions,
    });
}

  async getAllMockTests() {
    return this.readingRepository.findAll();
  }

  async getMockTestById(id: string) {
    return this.readingRepository.findById(id);
  }

  async deleteMockTest(id: string) {
    return this.readingRepository.delete(id);
  }

  async publishMockTest(id: string) {
    return this.readingRepository.publish(id);
  }

  async unpublishMockTest(id: string) {
    return this.readingRepository.unpublish(id);
  }

  // update mock test
  async updateMockTest(
  id: string,
  data: CreateReadingMockTestInput,
) {
  if (data.passages.length !== 3) {
    throw new Error(
      "Reading mock test must contain exactly 3 passages."
    );
  }

  let totalQuestions = 0;
  const usedQuestionNumbers = new Set<number>();

  for (const passage of data.passages) {
    totalQuestions += passage.questions.length;

    for (const question of passage.questions) {
      if (usedQuestionNumbers.has(question.questionNumber)) {
        throw new Error(
          `Question number ${question.questionNumber} is duplicated.`
        );
      }

      usedQuestionNumbers.add(question.questionNumber);
    }
  }

  return this.readingRepository.update(
    id,
    data,
    totalQuestions
  );
}

async getPublishedTests(page: number, limit: number) {
  const { tests, total } =
    await this.readingRepository.findPublished(page, limit);

  return {
    tests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async getPublishedTestById(id: string) {
  return this.readingRepository.findPublishedById(id);
}

}