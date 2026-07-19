import { SpeakingRepository } from "../speaking.repository";
import type {
  CreateSpeakingTestInput,
  SpeakingCategory,
  UpdateSpeakingTestInput,
} from "../speaking.schemas";

export class SpeakingAdminServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "SpeakingAdminServiceError";
  }
}

function categoryFromDatabase(category: string): SpeakingCategory {
  switch (category) {
    case "MOCK":
      return "mock";
    case "PART_1":
      return "part-1";
    case "PART_2":
      return "part-2";
    case "PART_3":
      return "part-3";
    default:
      throw new SpeakingAdminServiceError("Unknown speaking test category.", 500);
  }
}

export class SpeakingAdminService {
  constructor(private readonly speakingRepository = new SpeakingRepository()) {}

  private validateForCategory(data: CreateSpeakingTestInput) {
    const requiresPart1 = data.category === "mock" || data.category === "part-1";
    const requiresPart2 = data.category === "mock" || data.category === "part-2";
    const requiresPart3 = data.category === "mock" || data.category === "part-3";

    if (requiresPart1 && data.part1.questions.length === 0) {
      throw new SpeakingAdminServiceError("Part 1 needs at least one question.", 400);
    }
    if (requiresPart2) {
      if (!data.part2.cueCardTitle.trim() || !data.part2.cueCardDescription.trim()) {
        throw new SpeakingAdminServiceError(
          "Part 2 needs a cue-card title and description.",
          400
        );
      }
      if (data.part2.bulletPoints.filter(Boolean).length < 3) {
        throw new SpeakingAdminServiceError("Part 2 needs at least three bullet points.", 400);
      }
    }
    if (requiresPart3) {
      if (!data.part3.topic.trim()) {
        throw new SpeakingAdminServiceError("Part 3 needs a discussion topic.", 400);
      }
      if (data.part3.questions.length === 0) {
        throw new SpeakingAdminServiceError("Part 3 needs at least one question.", 400);
      }
    }
  }

  private toInput(test: Awaited<ReturnType<SpeakingRepository["findById"]>>) {
    if (!test) throw new SpeakingAdminServiceError("Speaking test not found.", 404);
    const part1 = test.parts.find((part) => part.partNumber === 1);
    const part2 = test.parts.find((part) => part.partNumber === 2);
    const part3 = test.parts.find((part) => part.partNumber === 3);
    if (!part1 || !part2 || !part3) {
      throw new SpeakingAdminServiceError("Speaking test has incomplete parts.", 500);
    }

    return {
      title: test.title,
      category: categoryFromDatabase(String(test.category)),
      part1: {
        durationMinutes: part1.durationMinutes,
        questions: part1.questions.map((question) => ({ text: question.text })),
      },
      part2: {
        cueCardTitle: part2.cueCardTitle ?? "",
        cueCardDescription: part2.cueCardDescription ?? "",
        bulletPoints: part2.bulletPoints,
        closingQuestion: part2.closingQuestion ?? "",
        preparationMinutes: part2.preparationMinutes,
        speakingMinutes: part2.speakingMinutes,
      },
      part3: {
        topic: part3.topic ?? "",
        durationMinutes: part3.durationMinutes,
        questions: part3.questions.map((question) => ({ text: question.text })),
      },
    } satisfies CreateSpeakingTestInput;
  }

  async createTest(data: CreateSpeakingTestInput) {
    this.validateForCategory(data);
    return this.speakingRepository.createTest(data);
  }

  async getAllTests() {
    return this.speakingRepository.findAll();
  }

  async getTestById(id: string) {
    const test = await this.speakingRepository.findById(id);
    if (!test) throw new SpeakingAdminServiceError("Speaking test not found.", 404);
    return test;
  }

  async updateTest(id: string, data: UpdateSpeakingTestInput) {
    const current = this.toInput(await this.speakingRepository.findById(id));
    const next = {
      title: data.title ?? current.title,
      category: data.category ?? current.category,
      part1: data.part1 ?? current.part1,
      part2: data.part2 ?? current.part2,
      part3: data.part3 ?? current.part3,
    } satisfies CreateSpeakingTestInput;
    this.validateForCategory(next);
    return this.speakingRepository.update(id, next);
  }

  async deleteTest(id: string) {
    await this.getTestById(id);
    return this.speakingRepository.delete(id);
  }

  async setPublished(id: string, isPublished: boolean) {
    await this.getTestById(id);
    return this.speakingRepository.setPublished(id, isPublished);
  }
}
