import type { WritingCategoryInput, WritingEssayInput } from "../writing.schemas";
import { WritingRepository } from "../writing.repository";

type LearnerWritingTestSource = {
  id: string;
  title: string;
  category: string;
  tasks: Array<{
    id: string;
    taskNumber: number;
    title: string;
    prompt: string;
    typeLabel: string | null;
    task1Type: string | null;
    imageUrl: string | null;
    imageAlt: string | null;
  }>;
};

export class WritingUserServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "WritingUserServiceError";
  }
}

function toLearnerCategory(category: string): WritingCategoryInput {
  if (category === "MOCK") return "mock";
  if (category === "TASK_2") return "task-2";
  return "task-1";
}

function toLearnerTask1Type(type: string | null) {
  if (!type) return undefined;

  return type.toLowerCase() as
    | "graph"
    | "chart"
    | "table"
    | "map"
    | "process"
    | "diagram"
    | "pie";
}

/** Maps published database content to the WritingTask shape used by the frontend. */
export function toLearnerWritingTest(test: LearnerWritingTestSource) {
  const category = toLearnerCategory(test.category);

  return {
    id: test.id,
    title: test.title,
    category,
    totalMinutes: category === "mock" ? 60 : category === "task-1" ? 20 : 40,
    isBackendTest: true as const,
    tasks: test.tasks.map((task) => ({
      id: task.id,
      testId: test.id,
      isBackendTest: true as const,
      taskNumber: task.taskNumber as 1 | 2,
      label: `Task ${task.taskNumber}`,
      title: task.title,
      prompt: task.prompt,
      minWords: task.taskNumber === 1 ? 150 : 250,
      recommendedMinutes: task.taskNumber === 1 ? 20 : 40,
      typeLabel: task.typeLabel ?? undefined,
      task1Type: toLearnerTask1Type(task.task1Type),
      imageUrl: task.imageUrl ?? undefined,
      imageAlt: task.imageAlt ?? undefined,
    })),
  };
}

function ensureEssayTasksBelongToTest(
  validTaskIds: Set<string>,
  essays: WritingEssayInput[]
) {
  const invalidTask = essays.find((essay) => !validTaskIds.has(essay.taskId));
  if (invalidTask) {
    throw new WritingUserServiceError(
      "One or more essays do not belong to this writing test.",
      400
    );
  }
}

export class WritingUserService {
  constructor(private readonly writingRepository = new WritingRepository()) {}

  async getPublishedTests(
    page: number,
    limit: number,
    category?: WritingCategoryInput
  ) {
    const { tests, total } = await this.writingRepository.findPublishedForLearners(
      page,
      limit,
      category
    );

    return {
      tests: tests.map((test) => {
        const learnerTest = toLearnerWritingTest(test);
        return {
          id: learnerTest.id,
          title: learnerTest.title,
          category: learnerTest.category,
          totalMinutes: learnerTest.totalMinutes,
          tasks: learnerTest.tasks.map((task) => ({
            id: task.id,
            taskNumber: task.taskNumber,
            title: task.title,
            typeLabel: task.typeLabel,
            task1Type: task.task1Type,
          })),
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPublishedTestById(id: string) {
    const test = await this.writingRepository.findPublishedByIdForLearner(id);
    if (!test) throw new WritingUserServiceError("Writing test not found.", 404);
    return toLearnerWritingTest(test);
  }

  async startAttempt(userId: string, testId: string) {
    const test = await this.getPublishedTestById(testId);
    const attempt = await this.writingRepository.createAttempt(userId, testId);
    return { attempt, test };
  }

  async saveDraft(userId: string, attemptId: string, essays: WritingEssayInput[]) {
    const attempt = await this.writingRepository.findAttemptWithTest(userId, attemptId);
    if (!attempt) throw new WritingUserServiceError("Writing attempt not found.", 404);
    if (attempt.status !== "DRAFT") {
      throw new WritingUserServiceError("Submitted essays cannot be changed.", 409);
    }

    ensureEssayTasksBelongToTest(new Set(attempt.test.tasks.map((task) => task.id)), essays);
    const savedAttempt = await this.writingRepository.saveDrafts(userId, attemptId, essays);
    if (!savedAttempt) {
      throw new WritingUserServiceError("Submitted essays cannot be changed.", 409);
    }
    return savedAttempt;
  }

  async submitEssay(userId: string, attemptId: string, submittedEssays: WritingEssayInput[]) {
    const attempt = await this.writingRepository.findAttemptWithTest(userId, attemptId);
    if (!attempt) throw new WritingUserServiceError("Writing attempt not found.", 404);

    if (attempt.status === "PENDING_ANALYSIS") {
      const storedAttempt = await this.writingRepository.submitForAnalysis(userId, attemptId, []);
      if (!storedAttempt.attempt) {
        throw new WritingUserServiceError("Writing attempt not found.", 404);
      }
      return storedAttempt;
    }

    ensureEssayTasksBelongToTest(
      new Set(attempt.test.tasks.map((task) => task.id)),
      submittedEssays
    );

    const finalContent = new Map(attempt.essays.map((essay) => [essay.taskId, essay.content]));
    submittedEssays.forEach((essay) => finalContent.set(essay.taskId, essay.content));
    if (![...finalContent.values()].some((content) => content.trim().length > 0)) {
      throw new WritingUserServiceError("Write an essay before submitting.", 400);
    }

    const submitted = await this.writingRepository.submitForAnalysis(
      userId,
      attemptId,
      submittedEssays
    );
    if (!submitted.attempt) {
      throw new WritingUserServiceError("Writing attempt could not be submitted.", 409);
    }
    return submitted;
  }
}
