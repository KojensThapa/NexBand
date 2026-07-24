import assert from "node:assert/strict";
import test from "node:test";

import {
  LISTENING_QUESTION_TYPES,
  calculateBand,
  evaluateListeningTest,
  type ListeningEvaluationQuestion,
} from "../src/modules/listening/algorithm/listeningAlgorithm";

test("listening evaluation supports an incomplete attempt, normalization, and report rules", () => {
  const result = evaluateListeningTest({
    questions: [
      { id: "p1-form", part: 1, type: "FORM_COMPLETION", correctAnswers: ["Nepal"] },
      { id: "p1-mcq", part: 1, type: "MULTIPLE_CHOICE", correctAnswers: ["B"] },
      { id: "p2-map", part: 2, type: "MAP_LABELLING", correctAnswers: ["library"] },
      { id: "p3-sentence", part: 3, type: "SENTENCE_COMPLETION", correctAnswers: ["Kathmandu"] },
      { id: "p4-note", part: 4, type: "NOTE_COMPLETION", correctAnswers: ["lecture"] },
    ],
    answers: {
      "p1-form": "  NEPAL, ",
      "p1-mcq": " ",
      "p2-map": "car park",
      "p3-sentence": "Kathmandu!",
    },
  });

  assert.equal(result.status, "Incomplete");
  assert.equal(result.totalQuestions, 5);
  assert.equal(result.attemptedQuestions, 3);
  assert.equal(result.skippedQuestions, 2);
  assert.equal(result.correctAnswers, 2);
  assert.equal(result.wrongAnswers, 1);
  assert.equal(result.attemptAccuracy, 66.67);
  assert.equal(result.overallBand, null);
  assert.equal(result.estimatedBand, 1.5);

  assert.deepEqual(result.partPerformance, [
    { part: 1, attempted: 1, skipped: 1, correct: 1, wrong: 0, accuracy: 100, status: "Attempted" },
    { part: 2, attempted: 1, skipped: 0, correct: 0, wrong: 1, accuracy: 0, status: "Attempted" },
    { part: 3, attempted: 1, skipped: 0, correct: 1, wrong: 0, accuracy: 100, status: "Attempted" },
    { part: 4, attempted: 0, skipped: 1, correct: 0, wrong: 0, accuracy: null, status: "Not Attempted" },
  ]);
  assert.ok(result.weakAreas.includes("Difficulty following directions."));
  assert.ok(result.recommendations.includes("Practice listening for directions and locations."));
  assert.ok(result.strengths.includes("Strong performance in everyday conversations."));
});

test("listening evaluation routes every supported question type to its evaluator", () => {
  const questions: ListeningEvaluationQuestion[] = LISTENING_QUESTION_TYPES.map((type, index) => ({
    id: `question-${type}`,
    part: ((index % 4) + 1) as 1 | 2 | 3 | 4,
    type,
    correctAnswers: ["Nepal", "Federal Democratic Republic of Nepal"],
  }));
  const answers = Object.fromEntries(
    questions.map((question) => [question.id, " nepal."])
  );

  const result = evaluateListeningTest({ questions, answers });

  assert.equal(result.status, "Completed");
  assert.equal(result.correctAnswers, questions.length);
  assert.equal(result.attemptedQuestions, questions.length);
  assert.equal(result.overallBand, calculateBand(questions.length));
  assert.equal(result.estimatedBand, null);
  assert.equal(result.questionTypePerformance.length, LISTENING_QUESTION_TYPES.length);
  assert.ok(result.questionTypePerformance.every((performance) => performance.accuracy === 100));
});

test("official IELTS Listening band boundaries are applied", () => {
  assert.equal(calculateBand(0), 0);
  assert.equal(calculateBand(2), 1.5);
  assert.equal(calculateBand(30), 7);
  assert.equal(calculateBand(39), 9);
  assert.equal(calculateBand(50), 9);
});
