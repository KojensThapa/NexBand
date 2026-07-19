import { Prisma, SpeakingAttemptStatus } from "@prisma/client";

import { calculateBasicSpeakingEvaluation } from "../algorithm/speakingAlgorithm";
import { SpeakingRepository } from "../speaking.repository";
import type {
  SpeakingCategory,
  SpeakingRecordings,
} from "../speaking.schemas";

type LearnerSpeakingTestSource = {
  id: string;
  title: string;
  category: string;
  parts: Array<{
    id: string;
    partNumber: number;
    cueCardTitle: string | null;
    cueCardDescription: string | null;
    bulletPoints: string[];
    closingQuestion: string | null;
    preparationMinutes: number;
    speakingMinutes: number;
    durationMinutes: number;
    topic: string | null;
    questions: Array<{ id: string; questionNumber: number; text: string }>;
  }>;
};

export class SpeakingUserServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "SpeakingUserServiceError";
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
      throw new SpeakingUserServiceError("Unknown speaking test category.", 500);
  }
}

function getParts(test: LearnerSpeakingTestSource) {
  const part1 = test.parts.find((part) => part.partNumber === 1);
  const part2 = test.parts.find((part) => part.partNumber === 2);
  const part3 = test.parts.find((part) => part.partNumber === 3);
  if (!part1 || !part2 || !part3) {
    throw new SpeakingUserServiceError("Speaking test has incomplete parts.", 500);
  }
  return { part1, part2, part3 };
}

function toPart1(part: ReturnType<typeof getParts>["part1"]) {
  return {
    partNumber: 1 as const,
    label: "Part 1 — Introduction",
    durationMinutes: part.durationMinutes,
    questions: part.questions.map((question) => ({ id: question.id, text: question.text })),
  };
}

function toPart2(part: ReturnType<typeof getParts>["part2"]) {
  const followUpQuestions = part.closingQuestion
    ? [{ id: `${part.id}-closing`, text: part.closingQuestion }]
    : [];
  return {
    partNumber: 2 as const,
    label: "Part 2 — Long Turn",
    prepMinutes: part.preparationMinutes,
    speakMinutes: part.speakingMinutes,
    cueCard: {
      topic: part.cueCardTitle ?? "",
      prompt: part.cueCardDescription || part.cueCardTitle || "",
      bulletPoints: part.bulletPoints,
      followUpQuestions,
    },
  };
}

function toPart3(part: ReturnType<typeof getParts>["part3"]) {
  return {
    partNumber: 3 as const,
    label: "Part 3",
    durationMinutes: part.durationMinutes,
    topic: part.topic || "Discussion",
    questions: part.questions.map((question) => ({ id: question.id, text: question.text })),
  };
}

/** Returns the exact task shapes used by the existing Speaking session UI. */
export function toLearnerSpeakingTask(test: LearnerSpeakingTestSource) {
  const category = categoryFromDatabase(test.category);
  const { part1, part2, part3 } = getParts(test);
  const frontendPart1 = toPart1(part1);
  const frontendPart2 = toPart2(part2);
  const frontendPart3 = toPart3(part3);

  if (category === "mock") {
    return {
      mode: category,
      task: {
        id: test.id,
        title: test.title,
        typeLabel: "Full Mock Test",
        totalMinutes:
          frontendPart1.durationMinutes +
          frontendPart2.prepMinutes +
          frontendPart2.speakMinutes +
          frontendPart3.durationMinutes,
        part1: frontendPart1,
        part2: frontendPart2,
        part3: frontendPart3,
      },
    };
  }
  if (category === "part-1") {
    return {
      mode: category,
      task: { id: test.id, title: test.title, typeLabel: "Part 1 · Practice", part1: frontendPart1 },
    };
  }
  if (category === "part-2") {
    return {
      mode: category,
      task: { id: test.id, title: test.title, typeLabel: "Part 2 · Cue Card", part2: frontendPart2 },
    };
  }
  return {
    mode: category,
    task: { id: test.id, title: test.title, typeLabel: "Part 3 · Discussion", part3: frontendPart3 },
  };
}

function readRecordings(value: Prisma.JsonValue): SpeakingRecordings {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};

  const recordings: SpeakingRecordings = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!raw || Array.isArray(raw) || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    if (
      typeof item.durationSeconds !== "number" ||
      !Number.isInteger(item.durationSeconds) ||
      item.durationSeconds <= 0
    ) {
      continue;
    }
    if (typeof item.audioUrl !== "string" && typeof item.audioStorageKey !== "string") continue;
    recordings[key] = {
      durationSeconds: item.durationSeconds,
      ...(typeof item.audioUrl === "string" ? { audioUrl: item.audioUrl } : {}),
      ...(typeof item.audioStorageKey === "string" ? { audioStorageKey: item.audioStorageKey } : {}),
      ...(typeof item.transcript === "string" ? { transcript: item.transcript } : {}),
    };
  }
  return recordings;
}

function allowedRecordingKeys(test: LearnerSpeakingTestSource): Set<string> {
  const category = categoryFromDatabase(test.category);
  const { part1, part2, part3 } = getParts(test);
  const keys = new Set<string>();
  if (category === "mock" || category === "part-1") {
    part1.questions.forEach((question) => keys.add(question.id));
  }
  if (category === "mock" || category === "part-2") {
    keys.add("part2-main");
    if (part2.closingQuestion) keys.add(`${part2.id}-closing`);
  }
  if (category === "mock" || category === "part-3") {
    part3.questions.forEach((question) => keys.add(question.id));
  }
  return keys;
}

export class SpeakingUserService {
  constructor(private readonly speakingRepository = new SpeakingRepository()) {}

  async getPublishedTests(category: SpeakingCategory | undefined, page: number, limit: number) {
    const { tests, total } = await this.speakingRepository.findPublished(category, page, limit);
    return {
      tests: tests.map((test) => ({
        id: test.id,
        title: test.title,
        mode: categoryFromDatabase(String(test.category)),
        typeLabel:
          String(test.category) === "MOCK" ? "Full Mock Test" : `Speaking ${String(test.category).replace("_", " ")}`,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPublishedTestById(id: string) {
    const test = await this.speakingRepository.findPublishedById(id);
    if (!test) throw new SpeakingUserServiceError("Speaking test not found.", 404);
    return toLearnerSpeakingTask(test);
  }

  async startAttempt(userId: string, testId: string) {
    const task = await this.getPublishedTestById(testId);
    const attempt = await this.speakingRepository.createAttempt(userId, testId);
    return { attempt, ...task };
  }

  async getAttempt(userId: string, attemptId: string) {
    const attempt = await this.speakingRepository.findAttemptWithContent(userId, attemptId);
    if (!attempt) throw new SpeakingUserServiceError("Speaking attempt not found.", 404);

    const task = toLearnerSpeakingTask(attempt.test);
    return {
      attempt: {
        id: attempt.id,
        testId: attempt.testId,
        status: attempt.status,
        recordings: readRecordings(attempt.recordings),
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        updatedAt: attempt.updatedAt,
      },
      ...task,
    };
  }

  private validateRecordingKeys(keys: Set<string>, recordings: SpeakingRecordings) {
    if (Object.keys(recordings).some((key) => !keys.has(key))) {
      throw new SpeakingUserServiceError(
        "One or more recordings do not belong to this speaking test.",
        400
      );
    }
  }

  async saveRecordings(userId: string, attemptId: string, recordings: SpeakingRecordings) {
    const attempt = await this.speakingRepository.findAttemptWithContent(userId, attemptId);
    if (!attempt) throw new SpeakingUserServiceError("Speaking attempt not found.", 404);
    if (attempt.status !== SpeakingAttemptStatus.IN_PROGRESS) {
      throw new SpeakingUserServiceError("Submitted speaking attempts cannot be changed.", 409);
    }
    this.validateRecordingKeys(allowedRecordingKeys(attempt.test), recordings);
    const saved = await this.speakingRepository.saveRecordings(userId, attemptId, recordings);
    if (!saved) throw new SpeakingUserServiceError("Submitted speaking attempts cannot be changed.", 409);
    return saved;
  }

  async submitAttempt(userId: string, attemptId: string, submittedRecordings?: SpeakingRecordings) {
    const attempt = await this.speakingRepository.findAttemptWithContent(userId, attemptId);
    if (!attempt) throw new SpeakingUserServiceError("Speaking attempt not found.", 404);
    if (attempt.status === SpeakingAttemptStatus.SUBMITTED) {
      if (!attempt.result) {
        throw new SpeakingUserServiceError("Speaking result is still being finalized.", 409);
      }
      return { attempt, result: attempt.result, alreadySubmitted: true };
    }

    const keys = allowedRecordingKeys(attempt.test);
    const recordings = { ...readRecordings(attempt.recordings), ...submittedRecordings };
    this.validateRecordingKeys(keys, recordings);
    const evaluation = calculateBasicSpeakingEvaluation(keys, recordings);
    if (evaluation.recordingCount === 0) {
      throw new SpeakingUserServiceError("Record at least one answer before submitting.", 400);
    }

    const completed = await this.speakingRepository.completeAttempt(
      userId,
      attemptId,
      recordings,
      evaluation
    );
    if (!completed.attempt || !completed.result) {
      throw new SpeakingUserServiceError("Speaking attempt could not be submitted.", 409);
    }
    return completed;
  }

  async getResult(userId: string, attemptId: string) {
    const result = await this.speakingRepository.findResultForAttempt(userId, attemptId);
    if (!result) throw new SpeakingUserServiceError("Speaking result not found.", 404);
    return result;
  }
}
