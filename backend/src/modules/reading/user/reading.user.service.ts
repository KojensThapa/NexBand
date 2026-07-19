import { Prisma, ReadingAttemptStatus } from "@prisma/client";

import { calculateBasicReadingScore } from "../algorithm/readingAlgorithm";
import { ReadingRepository } from "../reading.repository";
import type { ReadingAnswers } from "../reading.schemas";

type LearnerReadingTestSource = {
  id: string;
  title: string;
  duration: number;
  passages: Array<{
    id: string;
    passageNumber: number;
    title: string;
    instruction: string | null;
    passageText: string;
    imageUrl: string | null;
    questions: Array<{
      id: string;
      questionNumber: number;
      type: string;
      questionText: string;
      options: Prisma.JsonValue | null;
      marks: number;
    }>;
  }>;
};

export class ReadingUserServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "ReadingUserServiceError";
  }
}

function readAnswers(value: Prisma.JsonValue): ReadingAnswers {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  );
}

function toLearnerQuestionType(type: string) {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return "multiple-choice" as const;
    case "TRUE_FALSE_NOT_GIVEN":
      return "true-false-not-given" as const;
    case "SHORT_ANSWER":
      return "short-answer" as const;
    case "MATCHING_HEADING":
    case "MATCHING_INFORMATION":
    case "MATCHING_FEATURES":
    case "MATCHING_SENTENCE_ENDINGS":
      return "matching" as const;
    default:
      return "fill-blank" as const;
  }
}

function questionTypeLabel(type: string): string {
  return type
    .split("_")
    .map((word) => word[0] + word.slice(1).toLowerCase())
    .join(" ");
}

function toStringOptions(options: Prisma.JsonValue | null): string[] | undefined {
  if (!Array.isArray(options) || !options.every((option) => typeof option === "string")) {
    return undefined;
  }
  return options;
}

/** Maps normalized database fields to the ReadingMockTest shape used by the frontend. */
export function toLearnerReadingTest(test: LearnerReadingTestSource) {
  const minutesPerPassage = Math.max(1, Math.ceil(test.duration / 3));

  return {
    id: test.id,
    title: test.title,
    totalMinutes: test.duration,
    passages: test.passages.map((passage) => ({
      id: passage.id,
      partNumber: passage.passageNumber,
      label: `Part ${passage.passageNumber}`,
      title: passage.title,
      typeLabel: passage.questions[0] ? questionTypeLabel(passage.questions[0].type) : "Reading",
      passage: passage.passageText,
      instruction: passage.instruction ?? undefined,
      imageUrl: passage.imageUrl ?? undefined,
      questions: passage.questions.map((question) => ({
        id: question.id,
        number: question.questionNumber,
        type: toLearnerQuestionType(question.type),
        prompt: question.questionText,
        options: toStringOptions(question.options),
        marks: question.marks,
      })),
      recommendedMinutes: minutesPerPassage,
    })),
  };
}

export class ReadingUserService {
  constructor(private readonly readingRepository = new ReadingRepository()) {}

  async getPublishedTests(page: number, limit: number) {
    const { tests, total } = await this.readingRepository.findPublished(page, limit);
    return {
      tests: tests.map((test) => ({
        id: test.id,
        title: test.title,
        totalMinutes: test.duration,
        totalQuestions: test.totalQuestions,
        tags: test.tags,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPublishedTestById(id: string) {
    const test = await this.readingRepository.findPublishedById(id);
    if (!test) throw new ReadingUserServiceError("Reading test not found.", 404);
    return toLearnerReadingTest(test);
  }

  async startAttempt(userId: string, testId: string) {
    const test = await this.getPublishedTestById(testId);
    const attempt = await this.readingRepository.createAttempt(userId, testId);
    return { attempt, test };
  }

  private validateAnswers(questionIds: Set<string>, answers: ReadingAnswers) {
    const invalidQuestionIds = Object.keys(answers).filter((id) => !questionIds.has(id));
    if (invalidQuestionIds.length > 0) {
      throw new ReadingUserServiceError(
        "One or more answers do not belong to this reading test.",
        400
      );
    }
  }

  async saveAnswers(userId: string, attemptId: string, answers: ReadingAnswers) {
    const attempt = await this.readingRepository.findAttemptWithQuestions(userId, attemptId);
    if (!attempt) throw new ReadingUserServiceError("Reading attempt not found.", 404);
    if (attempt.status !== ReadingAttemptStatus.IN_PROGRESS) {
      throw new ReadingUserServiceError("Submitted reading attempts cannot be changed.", 409);
    }

    const questions = attempt.mockTest.passages.flatMap((passage) => passage.questions);
    this.validateAnswers(new Set(questions.map((question) => question.id)), answers);

    const savedAttempt = await this.readingRepository.saveAnswers(userId, attemptId, answers);
    if (!savedAttempt) {
      throw new ReadingUserServiceError("Submitted reading attempts cannot be changed.", 409);
    }
    return savedAttempt;
  }

  async submitAttempt(userId: string, attemptId: string, submittedAnswers?: ReadingAnswers) {
    const attempt = await this.readingRepository.findAttemptWithQuestions(userId, attemptId);
    if (!attempt) throw new ReadingUserServiceError("Reading attempt not found.", 404);

    if (attempt.status === ReadingAttemptStatus.SUBMITTED) {
      if (!attempt.result) {
        throw new ReadingUserServiceError("Reading result is still being finalized.", 409);
      }
      return { attempt, result: attempt.result, alreadySubmitted: true };
    }

    const questions = attempt.mockTest.passages.flatMap((passage) => passage.questions);
    const answers = {
      ...readAnswers(attempt.answers),
      ...submittedAnswers,
    };
    this.validateAnswers(new Set(questions.map((question) => question.id)), answers);

    const score = calculateBasicReadingScore(questions, answers);
    const completed = await this.readingRepository.completeAttempt(
      userId,
      attemptId,
      answers,
      score
    );

    if (!completed.attempt || !completed.result) {
      throw new ReadingUserServiceError("Reading attempt could not be submitted.", 409);
    }

    return completed;
  }

  async getResult(userId: string, attemptId: string) {
    const result = await this.readingRepository.findResultForAttempt(userId, attemptId);
    if (!result) throw new ReadingUserServiceError("Reading result not found.", 404);
    return result;
  }
}
