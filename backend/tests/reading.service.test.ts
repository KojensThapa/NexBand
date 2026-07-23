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
          passageNumber: 1,
          questions: [
            {
              id: "q1",
              type: "YES_NO_NOT_GIVEN",
              correctAnswer: ["YES"],
              marks: 1,
            },
            {
              id: "q2",
              type: "YES_NO_NOT_GIVEN",
              correctAnswer: ["NO"],
              marks: 2,
            },
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
  assert.equal(submitted.result.rawScore, 2);
  const persisted = completedWith as {
    answers: Record<string, string>;
    score: Record<string, unknown>;
  };
  assert.deepEqual(persisted.answers, { q1: "yes", q2: " no " });
  assert.equal(persisted.score.correctAnswers, 2);
  assert.equal(persisted.score.totalQuestions, 2);
  assert.equal(persisted.score.rawScore, 2);
  assert.equal(persisted.score.totalMarks, 2);
  assert.equal(persisted.score.percentage, 100);
  assert.equal(persisted.score.bandScore, 1.5);
  assert.equal(persisted.score.algorithmVersion, "reading-evaluator-v1");
  assert.deepEqual(persisted.score.report, {
    status: "Completed",
    totalQuestions: 2,
    attemptedQuestions: 2,
    skippedQuestions: 0,
    correctAnswers: 2,
    wrongAnswers: 0,
    attemptAccuracy: 100,
    overallBand: 1.5,
    estimatedBand: null,
    sectionPerformance: [
      {
        section: 1,
        attempted: 2,
        skipped: 0,
        correct: 2,
        wrong: 0,
        accuracy: 100,
        status: "Attempted",
      },
      {
        section: 2,
        attempted: 0,
        skipped: 0,
        correct: 0,
        wrong: 0,
        accuracy: null,
        status: "Not Attempted",
      },
      {
        section: 3,
        attempted: 0,
        skipped: 0,
        correct: 0,
        wrong: 0,
        accuracy: null,
        status: "Not Attempted",
      },
    ],
    questionTypePerformance: [
      {
        type: "YES_NO_NOT_GIVEN",
        label: "Yes / No / Not Given",
        total: 2,
        attempted: 2,
        correct: 2,
        accuracy: 100,
        status: "Attempted",
      },
    ],
    strengths: [
      "Good performance in Section 1",
      "Strong Yes / No / Not Given skills",
      "Excellent reading comprehension",
    ],
    weakAreas: [],
    recommendations: [],
  });

  await assert.rejects(
    () => service.saveAnswers("user-1", "attempt-1", { anotherTestQuestion: "answer" }),
    (error: unknown) =>
      error instanceof ReadingServiceError && error.statusCode === 400
  );
});
