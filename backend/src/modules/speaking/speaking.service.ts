import { SpeakingRepository } from "./speaking.repository";
import {
  type CreateSpeakingMockTestInput,
  type SpeakingCategoryInput,
} from "./speaking.schemas";

export class SpeakingService {
  private speakingRepository = new SpeakingRepository();

  async createMockTest(data: CreateSpeakingMockTestInput) {
    return this.speakingRepository.createMockTest(data);
  }

  async getAllMockTests() {
    return this.speakingRepository.findAll();
  }

  async getMockTestById(id: string) {
    return this.speakingRepository.findById(id);
  }

  async updateMockTest(id: string, data: CreateSpeakingMockTestInput) {
    return this.speakingRepository.update(id, data);
  }

  async deleteMockTest(id: string) {
    return this.speakingRepository.delete(id);
  }

  async publishMockTest(id: string) {
    return this.speakingRepository.publish(id);
  }

  async unpublishMockTest(id: string) {
    return this.speakingRepository.unpublish(id);
  }

  async getPublishedTests(
    page: number,
    limit: number,
    category?: SpeakingCategoryInput
  ) {
    const { tests, total } = await this.speakingRepository.findPublished(
      page,
      limit,
      category
    );

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
    return this.speakingRepository.findPublishedById(id);
  }
}
