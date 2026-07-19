import assert from "node:assert/strict";
import test from "node:test";

import { calculateBasicListeningScore } from "../src/modules/listening/algorithm/listeningAlgorithm";
import { toLearnerListeningTest } from "../src/modules/listening/user/listening.user.service";

test("basic listening scoring normalizes case and whitespace and honors marks", () => {
  const score = calculateBasicListeningScore(
    [
      { id: "q1", correctAnswer: "Tuesday", marks: 1 },
      { id: "q2", correctAnswer: "B", marks: 2 },
      { id: "q3", correctAnswer: "library card", marks: 1 },
    ],
    { q1: "  TUESDAY ", q2: "b", q3: "membership" }
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

test("learner listening projection includes playable content but never answer keys", () => {
  const testModel = toLearnerListeningTest({
    id: "test-1",
    title: "Academic Listening",
    iconStyle: "headphones",
    totalQuestions: 1,
    totalMinutes: 32,
    bufferSeconds: 30,
    parts: [
      {
        id: "part-1",
        partNumber: 1,
        title: "Library enquiry",
        instruction: "Choose the correct answer.",
        audioDurationSeconds: 120,
        mapImageUrl: null,
        mapImageAlt: null,
        questions: [
          {
            id: "question-1",
            questionNumber: 1,
            type: "MULTIPLE_CHOICE",
            questionText: "When does the library close?",
            options: ["5 pm", "6 pm", "7 pm"],
            marks: 1,
            correctAnswer: "B",
            explanation: "Admin-only explanation",
          },
        ],
      },
    ],
  });

  assert.equal(testModel.isBackendTest, true);
  assert.equal(testModel.parts[0]?.audioUrl, "/api/listening/tests/test-1/parts/1/audio");
  assert.deepEqual(testModel.parts[0]?.questions[0], {
    id: "question-1",
    number: 1,
    type: "multiple-choice",
    prompt: "When does the library close?",
    options: ["5 pm", "6 pm", "7 pm"],
    marks: 1,
  });
  assert.equal("correctAnswer" in (testModel.parts[0]?.questions[0] ?? {}), false);
  assert.equal("explanation" in (testModel.parts[0]?.questions[0] ?? {}), false);
});
