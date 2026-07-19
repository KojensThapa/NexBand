import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateBasicReadingScore,
  ReadingService,
  ReadingServiceError,
  toLearnerReadingTest,
} from "../src/modules/reading/reading.service";

test("basic reading scoring normalizes case and whitespace and honors question marks", () => {
  const score = calculateBasicReadingScore(
    [
      { id: "q1", correctAnswer: ["TRUE"], marks: 1 },
      { id: "q2", correctAnswer: ["B. Neural connections"], marks: 2 },
      { id: "q3", correctAnswer: ["not given"], marks: 1 },
    ],
    { q1: "  true ", q2: "b.   neural connections", q3: "false" }
  );

  assert.deepEqual(score, {
    correctAnswers: 2,
    totalQuestions: 3,
    rawScore: 3,
    totalMarks: 4,
    percentage: 75,
    bandScore: 7,
    algorithmVersion: "basic-v1",
  });
});

test("learner test projection matches the reading session model and omits answer keys", () => {
  const testModel = toLearnerReadingTest({
    id: "test-1",
    title: "Academic Reading",
    duration: 60,
    passages: [
      {
        id: "passage-1",
        passageNumber: 1,
        title: "A passage",
        instruction: "Choose the correct answer.",
        passageText: "The passage text.",
        imageUrl: null,
        questions: [
          {
            id: "question-1",
            questionNumber: 1,
            type: "TRUE_FALSE_NOT_GIVEN",
            questionText: "The statement is true.",
            options: ["TRUE", "FALSE", "NOT GIVEN"],
            marks: 1,
            // Extra source fields are intentionally not read by the mapper.
            correctAnswer: ["TRUE"],
            explanation: "Admin-only feedback",
          },
        ],
      },
    ],
  });

  assert.deepEqual(testModel, {
    id: "test-1",
    title: "Academic Reading",
    totalMinutes: 60,
    passages: [
      {
        id: "passage-1",
        partNumber: 1,
        label: "Part 1",
        title: "A passage",
        typeLabel: "True False Not Given",
        passage: "The passage text.",
        instruction: "Choose the correct answer.",
        imageUrl: undefined,
        questions: [
          {
            id: "question-1",
            number: 1,
            type: "true-false-not-given",
            prompt: "The statement is true.",
            options: ["TRUE", "FALSE", "NOT GIVEN"],
            marks: 1,
          },
        ],
        recommendedMinutes: 20,
      },
    ],
  });
  assert.equal("correctAnswer" in testModel.passages[0].questions[0], false);
});

test("submitting an attempt merges final answers, saves one result, and rejects foreign question IDs", async () => {
  const attempt = {
    id: "attempt-1",
    userId: "user-1",
    status: "IN_PROGRESS",
    answers: { q1: "yes" },
    mockTest: {
      passages: [
        {
          questions: [
            { id: "q1", correctAnswer: ["YES"], marks: 1 },
            { id: "q2", correctAnswer: ["NO"], marks: 2 },
          ],
        },
      ],
    },
  };
  let completedWith: unknown;

  const repository = {
    findAttemptWithQuestions: async () => attempt,
    completeAttempt: async (
      _userId: string,
      _attemptId: string,
      answers: Record<string, string>,
      score: Record<string, unknown>
    ) => {
      completedWith = { answers, score };
      return {
        attempt: { ...attempt, status: "SUBMITTED" },
        result: { id: "result-1", ...score },
        alreadySubmitted: false,
      };
    },
    saveAnswers: async () => ({ id: attempt.id }),
  };
  const service = new ReadingService(repository as never);

  const submitted = await service.submitAttempt("user-1", "attempt-1", { q2: " no " });
  assert.equal(submitted.result.rawScore, 3);
  assert.deepEqual(completedWith, {
    answers: { q1: "yes", q2: " no " },
    score: {
      correctAnswers: 2,
      totalQuestions: 2,
      rawScore: 3,
      totalMarks: 3,
      percentage: 100,
      bandScore: 9,
      algorithmVersion: "basic-v1",
    },
  });

  await assert.rejects(
    () => service.saveAnswers("user-1", "attempt-1", { anotherTestQuestion: "answer" }),
    (error: unknown) =>
      error instanceof ReadingServiceError && error.statusCode === 400
  );
});
