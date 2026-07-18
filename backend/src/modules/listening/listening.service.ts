import { ListeningRepository } from "./listening.repository";
import { CreateListeningMockTestInput } from "./listening.schemas";

export class ListeningService {
  private listeningRepository = new ListeningRepository();

  private validateMockTest(data: CreateListeningMockTestInput) {
    if (data.parts.length !== 4) {
      throw new Error("Listening mock test must contain exactly 4 parts.");
    }

    const partNumbers = new Set<number>(data.parts.map((part) => part.partNumber));
    if (partNumbers.size !== 4 || ![1, 2, 3, 4].every((part) => partNumbers.has(part))) {
      throw new Error("Listening mock test must contain parts 1, 2, 3, and 4 exactly once.");
    }

    let totalQuestions = 0;

    for (const part of data.parts) {
      if (part.questions.length === 0) {
        throw new Error(`Part ${part.partNumber} must contain at least one question.`);
      }

      if (!part.audioStorageKey && !part.audioUrl) {
        throw new Error(`Part ${part.partNumber} requires an audio source.`);
      }

      totalQuestions += part.questions.length;
      const usedQuestionNumbers = new Set<number>();

      for (const question of part.questions) {
        if (usedQuestionNumbers.has(question.questionNumber)) {
          throw new Error(
            `Question number ${question.questionNumber} is duplicated in part ${part.partNumber}.`
          );
        }

        usedQuestionNumbers.add(question.questionNumber);
      }
    }

    return totalQuestions;
  }

  async createMockTest(data: CreateListeningMockTestInput) {
    const totalQuestions = this.validateMockTest(data);

    return this.listeningRepository.createMockTest({
      ...data,
      totalQuestions,
    });
  }

  async getAllMockTests() {
    return this.listeningRepository.findAll();
  }

  async getMockTestById(id: string) {
    return this.listeningRepository.findById(id);
  }

  async updateMockTest(id: string, data: CreateListeningMockTestInput) {
    const totalQuestions = this.validateMockTest(data);

    return this.listeningRepository.update(id, data, totalQuestions);
  }

  async deleteMockTest(id: string) {
    return this.listeningRepository.delete(id);
  }

  async publishMockTest(id: string) {
    return this.listeningRepository.publish(id);
  }

  async unpublishMockTest(id: string) {
    return this.listeningRepository.unpublish(id);
  }

  async getPublishedTests(page: number, limit: number) {
    const { tests, total } = await this.listeningRepository.findPublished(page, limit);

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
    return this.listeningRepository.findPublishedById(id);
  }
}
