import { ListeningAttemptStatus, Prisma } from "@prisma/client";

import { calculateBasicListeningScore } from "../algorithm/listeningAlgorithm";
import { ListeningUserRepository } from "./listening.user.repository";
import { toListeningQuestionTypeInput, type ListeningAnswers } from "../listening.schemas";

type LearnerListeningTestSource = {
  id: string;
  title: string;
  iconStyle: "headphones" | "broadcast" | "microphone";
  totalQuestions: number;
  totalMinutes: number;
  bufferSeconds: number;
  parts: Array<{
    id: string;
    partNumber: number;
    title: string;
    instruction: string;
    audioDurationSeconds: number;
    mapImageUrl: string | null;
    mapImageAlt: string | null;
    questions: Array<{
      id: string;
      questionNumber: number;
      type: string;
      questionText: string;
      options: string[];
      marks: number;
    }>;
  }>;
};

export class ListeningUserServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "ListeningUserServiceError";
  }
}

function readAnswers(value: Prisma.JsonValue): ListeningAnswers {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  );
}

function formatQuestionText(questionText: string, options: string[]): string {
  if (options.length === 0) return questionText;

  return `${questionText}\n${options
    .map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`)
    .join("\n")}`;
}

/** Maps the published database projection to the existing listening session UI. */
export function toLearnerListeningTest(test: LearnerListeningTestSource) {
  return {
    id: test.id,
    title: test.title,
    typeLabel: "Full Mock Test",
    iconStyle: test.iconStyle,
    totalMinutes: test.totalMinutes,
    bufferSeconds: test.bufferSeconds,
    isBackendTest: true,
    parts: test.parts.map((part) => ({
      id: part.id,
      partNumber: part.partNumber,
      label: `Part ${part.partNumber}`,
      title: part.title,
      instruction: part.instruction,
      // This endpoint redirects to the configured remote audio source. Keeping
      // the address behind the API lets the admin storage implementation change
      // without a frontend release.
      audioUrl: `/api/listening/tests/${test.id}/parts/${part.partNumber}/audio`,
      audioDurationSeconds: part.audioDurationSeconds,
      mapImageUrl: part.mapImageUrl ?? undefined,
      mapImageAlt: part.mapImageAlt ?? undefined,
      questions: part.questions.map((question) => ({
        id: question.id,
        number: question.questionNumber,
        type: toListeningQuestionTypeInput(question.type),
        prompt: question.questionText,
        options: question.options,
        marks: question.marks,
      })),
      tableHeaders: ["Question", "Your answer"],
      tableRows: part.questions.map((question) => ({
        cells: [
          formatQuestionText(question.questionText, question.options),
          [{ questionNumber: question.questionNumber, questionId: question.id }],
        ],
      })),
    })),
  };
}

export class ListeningUserService {
  constructor(private readonly listeningRepository = new ListeningUserRepository()) {}

  async getPublishedTests(page: number, limit: number) {
    const { tests, total } = await this.listeningRepository.findPublished(page, limit);
    return {
      tests: tests.map((test) => ({
        id: test.id,
        title: test.title,
        iconStyle: test.iconStyle,
        typeLabel: "Full Mock Test",
        totalMinutes: test.totalMinutes,
        bufferSeconds: test.bufferSeconds,
        totalQuestions: test.totalQuestions,
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
    const test = await this.listeningRepository.findPublishedById(id);
    if (!test) throw new ListeningUserServiceError("Listening test not found.", 404);
    return toLearnerListeningTest(test);
  }

  async getAudioUrl(testId: string, partNumber: number) {
    const part = await this.listeningRepository.findPublishedAudioSource(testId, partNumber);
    if (!part) throw new ListeningUserServiceError("Listening audio not found.", 404);
    if (!part.audioUrl) {
      throw new ListeningUserServiceError(
        "This audio is stored only in the author's browser. Publish it to a server-accessible URL before learners can play it.",
        409
      );
    }
    return part.audioUrl;
  }

  async startAttempt(userId: string, testId: string) {
    const test = await this.getPublishedTestById(testId);
    const attempt = await this.listeningRepository.createAttempt(userId, testId);
    return { attempt, test };
  }

  private validateAnswers(questionIds: Set<string>, answers: ListeningAnswers) {
    const invalidQuestionIds = Object.keys(answers).filter((id) => !questionIds.has(id));
    if (invalidQuestionIds.length > 0) {
      throw new ListeningUserServiceError(
        "One or more answers do not belong to this listening test.",
        400
      );
    }
  }

  async saveAnswers(userId: string, attemptId: string, answers: ListeningAnswers) {
    const attempt = await this.listeningRepository.findAttemptWithQuestions(userId, attemptId);
    if (!attempt) throw new ListeningUserServiceError("Listening attempt not found.", 404);
    if (attempt.status !== ListeningAttemptStatus.IN_PROGRESS) {
      throw new ListeningUserServiceError("Submitted listening attempts cannot be changed.", 409);
    }

    const questions = attempt.mockTest.parts.flatMap((part) => part.questions);
    this.validateAnswers(new Set(questions.map((question) => question.id)), answers);

    const savedAttempt = await this.listeningRepository.saveAnswers(userId, attemptId, answers);
    if (!savedAttempt) {
      throw new ListeningUserServiceError("Submitted listening attempts cannot be changed.", 409);
    }
    return savedAttempt;
  }

  async submitAttempt(userId: string, attemptId: string, submittedAnswers?: ListeningAnswers) {
    const attempt = await this.listeningRepository.findAttemptWithQuestions(userId, attemptId);
    if (!attempt) throw new ListeningUserServiceError("Listening attempt not found.", 404);

    if (attempt.status === ListeningAttemptStatus.SUBMITTED) {
      if (!attempt.result) {
        throw new ListeningUserServiceError("Listening result is still being finalized.", 409);
      }
      return { attempt, result: attempt.result, alreadySubmitted: true };
    }

    const questions = attempt.mockTest.parts.flatMap((part) => part.questions);
    const answers = { ...readAnswers(attempt.answers), ...submittedAnswers };
    this.validateAnswers(new Set(questions.map((question) => question.id)), answers);

    const score = calculateBasicListeningScore(questions, answers);
    const completed = await this.listeningRepository.completeAttempt(
      userId,
      attemptId,
      answers,
      score
    );

    if (!completed.attempt || !completed.result) {
      throw new ListeningUserServiceError("Listening attempt could not be submitted.", 409);
    }

    return completed;
  }

  async getResult(userId: string, attemptId: string) {
    const result = await this.listeningRepository.findResultForAttempt(userId, attemptId);
    if (!result) throw new ListeningUserServiceError("Listening result not found.", 404);
    return result;
  }
}
