import { Prisma, ReadingAttemptStatus } from "@prisma/client";

import {
  evaluateReadingTest,
  type ReadingQuestionType,
  type ReadingSection,
} from "./algorithm/readingAlgorithm";
import { ReadingRepository } from "./reading.repository";
import type {
  CreateReadingMockTestInput,
  ReadingAnswers,
  UpdateReadingMockTestInput,
} from "./reading.schemas";

export class ReadingServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "ReadingServiceError";
  }
}

type ScoreableQuestion = {
  id: string;
  correctAnswer: string[];
  marks: number;
};

type ReadingQuestionInput = CreateReadingMockTestInput["passages"][number]["questions"][number];

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

export type BasicReadingScore = {
  correctAnswers: number;
  totalQuestions: number;
  rawScore: number;
  totalMarks: number;
  percentage: number;
  bandScore: number;
  algorithmVersion: "basic-v1";
};

function normalizeAnswer(answer: string): string {
  return answer
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
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

type EvaluationPassage = {
  passageNumber: number;
  questions: Array<{
    id: string;
    type: string;
    correctAnswer: string[];
  }>;
};

/** Adapts persisted Reading data to the pure evaluation algorithm's input. */
function evaluateAttempt(passages: readonly EvaluationPassage[], answers: ReadingAnswers) {
  const questions = passages.flatMap((passage) =>
    passage.questions.map((question) => ({
      id: question.id,
      section: passage.passageNumber as ReadingSection,
      type: question.type as ReadingQuestionType,
      correctAnswer: question.correctAnswer,
    }))
  );
  const report = evaluateReadingTest({ questions, answers });
  const bandScore = report.overallBand ?? report.estimatedBand ?? 0;

  return {
    correctAnswers: report.correctAnswers,
    totalQuestions: report.totalQuestions,
    rawScore: report.correctAnswers,
    totalMarks: report.totalQuestions,
    percentage: report.attemptAccuracy ?? 0,
    bandScore,
    algorithmVersion: "reading-evaluator-v1",
    report: report as unknown as Prisma.InputJsonValue,
  };
}

function toLearnerQuestionType(type: string) {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return "multiple-choice" as const;
    case "TRUE_FALSE_NOT_GIVEN":
      return "true-false-not-given" as const;
    case "YES_NO_NOT_GIVEN":
      return "yes-no-not-given" as const;
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

/** Maps normalized database fields to the reading session shape used by the frontend. */
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

/**
 * Scores exact reading answers with case- and whitespace-insensitive matching.
 * The band is intentionally a provisional linear 0–9 estimate rounded to the
 * nearest half band; it is not an official IELTS conversion table.
 */
export function calculateBasicReadingScore(
  questions: ScoreableQuestion[],
  answers: ReadingAnswers
): BasicReadingScore {
  let correctAnswers = 0;
  let rawScore = 0;
  const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);

  for (const question of questions) {
    const submitted = answers[question.id];
    if (!submitted) continue;

    const normalizedSubmitted = normalizeAnswer(submitted);
    const isCorrect = question.correctAnswer.some(
      (answer) => normalizeAnswer(answer) === normalizedSubmitted
    );

    if (isCorrect) {
      correctAnswers += 1;
      rawScore += question.marks;
    }
  }

  const percentage = totalMarks === 0 ? 0 : (rawScore / totalMarks) * 100;
  const bandScore = Number((Math.round(((percentage / 100) * 9) * 2) / 2).toFixed(1));

  return {
    correctAnswers,
    totalQuestions: questions.length,
    rawScore,
    totalMarks,
    percentage: Number(percentage.toFixed(2)),
    bandScore,
    algorithmVersion: "basic-v1",
  };
}

export class ReadingService {
  constructor(private readonly readingRepository = new ReadingRepository()) {}

  private validateMockTest(data: CreateReadingMockTestInput) {
    if (data.passages.length !== 3) {
      throw new ReadingServiceError(
        "Reading mock test must contain exactly 3 passages.",
        400
      );
    }

    const passageNumbers = new Set(data.passages.map((passage) => passage.passageNumber));
    if (passageNumbers.size !== 3 || ![1, 2, 3].every((number) => passageNumbers.has(number))) {
      throw new ReadingServiceError(
        "Reading mock test must contain passages 1, 2, and 3 exactly once.",
        400
      );
    }

    const usedQuestionNumbers = new Set<number>();
    let totalQuestions = 0;

    for (const passage of data.passages) {
      if (passage.questions.length === 0) {
        throw new ReadingServiceError(
          `Passage ${passage.passageNumber} must contain at least one question.`,
          400
        );
      }

      totalQuestions += passage.questions.length;

      for (const question of passage.questions) {
        if (usedQuestionNumbers.has(question.questionNumber)) {
          throw new ReadingServiceError(
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
    if (!test) throw new ReadingServiceError("Reading test not found.", 404);
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
          options: toStringOptions(question.options ?? null),
          correctAnswer: question.correctAnswer,
          marks: question.marks,
          explanation: question.explanation ?? undefined,
        })),
      })),
    } satisfies CreateReadingMockTestInput;

    const totalQuestions = this.validateMockTest(next);
    return this.readingRepository.update(id, next, totalQuestions);
  }

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
    if (!test) throw new ReadingServiceError("Reading test not found.", 404);
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
      throw new ReadingServiceError(
        "One or more answers do not belong to this reading test.",
        400
      );
    }
  }

  async saveAnswers(userId: string, attemptId: string, answers: ReadingAnswers) {
    const attempt = await this.readingRepository.findAttemptWithQuestions(userId, attemptId);
    if (!attempt) throw new ReadingServiceError("Reading attempt not found.", 404);
    if (attempt.status !== ReadingAttemptStatus.IN_PROGRESS) {
      throw new ReadingServiceError("Submitted reading attempts cannot be changed.", 409);
    }

    const questions = attempt.mockTest.passages.flatMap((passage) => passage.questions);
    this.validateAnswers(new Set(questions.map((question) => question.id)), answers);

    const savedAttempt = await this.readingRepository.saveAnswers(userId, attemptId, answers);
    if (!savedAttempt) {
      throw new ReadingServiceError("Submitted reading attempts cannot be changed.", 409);
    }
    return savedAttempt;
  }

  async submitAttempt(userId: string, attemptId: string, submittedAnswers?: ReadingAnswers) {
    const attempt = await this.readingRepository.findAttemptWithQuestions(userId, attemptId);
    if (!attempt) throw new ReadingServiceError("Reading attempt not found.", 404);

    if (attempt.status === ReadingAttemptStatus.SUBMITTED) {
      if (!attempt.result) {
        throw new ReadingServiceError("Reading result is still being finalized.", 409);
      }
      return { attempt, result: attempt.result, alreadySubmitted: true };
    }

    const questions = attempt.mockTest.passages.flatMap((passage) => passage.questions);
    const answers = {
      ...readAnswers(attempt.answers),
      ...submittedAnswers,
    };
    this.validateAnswers(new Set(questions.map((question) => question.id)), answers);

    const score = evaluateAttempt(attempt.mockTest.passages, answers);
    const completed = await this.readingRepository.completeAttempt(
      userId,
      attemptId,
      answers,
      score
    );

    if (!completed.attempt || !completed.result) {
      throw new ReadingServiceError("Reading attempt could not be submitted.", 409);
    }

    return completed;
  }

  async getResult(userId: string, attemptId: string) {
    const result = await this.readingRepository.findResultForAttempt(userId, attemptId);
    if (!result) throw new ReadingServiceError("Reading result not found.", 404);
    return result;
  }
}
