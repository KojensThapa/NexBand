import { WritingRepository } from "./writing.repository";
import {
  type CreateWritingTestInput,
  type WritingCategoryInput,
} from "./writing.schemas";

export class WritingService {
  private writingRepository = new WritingRepository();

  async createTest(data: CreateWritingTestInput) {
    return this.writingRepository.createTest(data);
  }

  async getAllTests() {
    return this.writingRepository.findAll();
  }

  async getTestById(id: string) {
    return this.writingRepository.findById(id);
  }

  async updateTest(id: string, data: CreateWritingTestInput) {
    return this.writingRepository.update(id, data);
  }

  async deleteTest(id: string) {
    return this.writingRepository.delete(id);
  }

  async publishTest(id: string) {
    return this.writingRepository.publish(id);
  }

  async unpublishTest(id: string) {
    return this.writingRepository.unpublish(id);
  }

  async getPublishedTests(
    page: number,
    limit: number,
    category?: WritingCategoryInput
  ) {
    const { tests, total } = await this.writingRepository.findPublished(
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
    return this.writingRepository.findPublishedById(id);
  }
}
