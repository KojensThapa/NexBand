import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateBand,
  evaluateReadingTest,
  READING_QUESTION_TYPES,
} from "../src/modules/reading/algorithm/readingAlgorithm";
import type { ReadingEvaluationQuestion } from "../src/modules/reading/algorithm/readingAlgorithm";

test("the reading evaluator normalizes answers and handles incomplete attempts", () => {
  const result = evaluateReadingTest({
    questions: [
      { id: "q1", section: 1, type: "MULTIPLE_CHOICE", correctAnswer: ["Nepal"] },
      { id: "q2", section: 1, type: "TRUE_FALSE_NOT_GIVEN", correctAnswer: ["TRUE"] },
      { id: "q3", section: 1, type: "YES_NO_NOT_GIVEN", correctAnswer: ["NOT GIVEN"] },
      {
        id: "q4",
        section: 2,
        type: "MATCHING_HEADING",
        correctAnswer: [],
        correctMappings: { paragraphA: "i", paragraphB: "ii" },
      },
      { id: "q5", section: 2, type: "SHORT_ANSWER", correctAnswer: ["Mount Everest"] },
      { id: "q6", section: 3, type: "MULTIPLE_CHOICE", correctAnswer: ["C"] },
    ],
    answers: {
      q1: "  NEPAL,  ",
      q2: " true ",
      q3: "   ",
      q4: { paragraphA: "i", paragraphB: "iii" },
      q5: "mount everest!",
    },
  });

  assert.equal(result.status, "Incomplete");
  assert.equal(result.totalQuestions, 6);
  assert.equal(result.attemptedQuestions, 4);
  assert.equal(result.skippedQuestions, 2);
  assert.equal(result.correctAnswers, 3);
  assert.equal(result.wrongAnswers, 1);
  assert.equal(result.attemptAccuracy, 75);
  assert.equal(result.overallBand, null);
  assert.equal(result.estimatedBand, 2);
  assert.deepEqual(result.sectionPerformance, [
    {
      section: 1,
      attempted: 2,
      skipped: 1,
      correct: 2,
      wrong: 0,
      accuracy: 100,
      status: "Attempted",
    },
    {
      section: 2,
      attempted: 2,
      skipped: 0,
      correct: 1,
      wrong: 1,
      accuracy: 50,
      status: "Attempted",
    },
    {
      section: 3,
      attempted: 0,
      skipped: 1,
      correct: 0,
      wrong: 0,
      accuracy: null,
      status: "Not Attempted",
    },
  ]);
  assert.ok(result.weakAreas.includes("Weak in Matching Headings"));
  assert.ok(result.recommendations.includes("Practice identifying paragraph main ideas."));
});

test("the evaluator supports every required question type and marks a full submission complete", () => {
  const questions: ReadingEvaluationQuestion[] = READING_QUESTION_TYPES.map((type, index) => ({
    id: `q${index + 1}`,
    section: ((index % 3) + 1) as 1 | 2 | 3,
    type,
    correctAnswer: ["Nepal"],
  }));
  const answers = Object.fromEntries(questions.map((question) => [question.id, " nepal."]));

  const result = evaluateReadingTest({ questions, answers });

  assert.equal(result.status, "Completed");
  assert.equal(result.correctAnswers, READING_QUESTION_TYPES.length);
  assert.equal(result.wrongAnswers, 0);
  assert.equal(result.overallBand, calculateBand(READING_QUESTION_TYPES.length));
  assert.equal(result.estimatedBand, null);
  assert.equal(result.questionTypePerformance.length, READING_QUESTION_TYPES.length);
  assert.ok(result.questionTypePerformance.every((performance) => performance.accuracy === 100));
});

test("the official band conversion supports Academic and General Training Reading", () => {
  assert.equal(calculateBand(30), 7);
  assert.equal(calculateBand(39, "GENERAL_TRAINING"), 8.5);
  assert.equal(calculateBand(0), 0);
});
