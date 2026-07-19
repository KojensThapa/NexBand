import assert from "node:assert/strict";
import test from "node:test";

import { calculateBasicSpeakingEvaluation } from "../src/modules/speaking/algorithm/speakingAlgorithm";
import {
  SpeakingUserService,
  SpeakingUserServiceError,
  toLearnerSpeakingTask,
} from "../src/modules/speaking/user/speaking.user.service";

test("basic speaking evaluation uses recording coverage and duration only", () => {
  const evaluation = calculateBasicSpeakingEvaluation(
    new Set(["q1", "q2", "part2-main"]),
    {
      q1: { audioUrl: "https://storage.example/q1.webm", durationSeconds: 30 },
      q2: { audioUrl: "https://storage.example/q2.webm", durationSeconds: 30 },
      ignored: { audioUrl: "https://storage.example/ignored.webm", durationSeconds: 60 },
    }
  );

  assert.equal(evaluation.recordingCount, 2);
  assert.equal(evaluation.totalQuestions, 3);
  assert.equal(evaluation.totalDurationSeconds, 60);
  assert.equal(evaluation.completionPercentage, 66.67);
  assert.equal(evaluation.basicScore, 76.67);
  assert.equal(evaluation.estimatedBandScore, 6);
  assert.equal(evaluation.evaluationMode, "BASIC");
});

test("learner task projection follows the existing Part 2 frontend model", () => {
  const projected = toLearnerSpeakingTask({
    id: "speaking-1",
    title: "Memorable trip",
    category: "PART_2",
    parts: [
      {
        id: "part-1",
        partNumber: 1,
        cueCardTitle: null,
        cueCardDescription: null,
        bulletPoints: [],
        closingQuestion: null,
        preparationMinutes: 1,
        speakingMinutes: 2,
        durationMinutes: 5,
        topic: null,
        questions: [],
      },
      {
        id: "part-2",
        partNumber: 2,
        cueCardTitle: "A memorable trip",
        cueCardDescription: "Describe a memorable trip you took.",
        bulletPoints: ["Where you went", "Who you went with", "Why it was memorable"],
        closingQuestion: "Would you go there again?",
        preparationMinutes: 1,
        speakingMinutes: 2,
        durationMinutes: 5,
        topic: null,
        questions: [],
      },
      {
        id: "part-3",
        partNumber: 3,
        cueCardTitle: null,
        cueCardDescription: null,
        bulletPoints: [],
        closingQuestion: null,
        preparationMinutes: 1,
        speakingMinutes: 2,
        durationMinutes: 5,
        topic: null,
        questions: [],
      },
    ],
  });

  assert.deepEqual(projected, {
    mode: "part-2",
    task: {
      id: "speaking-1",
      title: "Memorable trip",
      typeLabel: "Part 2 · Cue Card",
      part2: {
        partNumber: 2,
        label: "Part 2 — Long Turn",
        prepMinutes: 1,
        speakMinutes: 2,
        cueCard: {
          topic: "A memorable trip",
          prompt: "Describe a memorable trip you took.",
          bulletPoints: ["Where you went", "Who you went with", "Why it was memorable"],
          followUpQuestions: [{ id: "part-2-closing", text: "Would you go there again?" }],
        },
      },
    },
  });
});

test("submitting accepts valid recordings and rejects recordings from another test", async () => {
  const attempt = {
    id: "attempt-1",
    status: "IN_PROGRESS",
    recordings: { q1: { audioUrl: "https://storage.example/q1.webm", durationSeconds: 25 } },
    test: {
      id: "test-1",
      title: "Part 1 practice",
      category: "PART_1",
      parts: [
        {
          id: "part-1",
          partNumber: 1,
          cueCardTitle: null,
          cueCardDescription: null,
          bulletPoints: [],
          closingQuestion: null,
          preparationMinutes: 1,
          speakingMinutes: 2,
          durationMinutes: 5,
          topic: null,
          questions: [
            { id: "q1", questionNumber: 1, text: "Where are you from?" },
            { id: "q2", questionNumber: 2, text: "What do you study?" },
          ],
        },
        {
          id: "part-2",
          partNumber: 2,
          cueCardTitle: null,
          cueCardDescription: null,
          bulletPoints: [],
          closingQuestion: null,
          preparationMinutes: 1,
          speakingMinutes: 2,
          durationMinutes: 5,
          topic: null,
          questions: [],
        },
        {
          id: "part-3",
          partNumber: 3,
          cueCardTitle: null,
          cueCardDescription: null,
          bulletPoints: [],
          closingQuestion: null,
          preparationMinutes: 1,
          speakingMinutes: 2,
          durationMinutes: 5,
          topic: null,
          questions: [],
        },
      ],
    },
  };
  let completed: unknown;
  const repository = {
    findAttemptWithContent: async () => attempt,
    completeAttempt: async (
      _userId: string,
      _attemptId: string,
      recordings: Record<string, unknown>,
      evaluation: Record<string, unknown>
    ) => {
      completed = { recordings, evaluation };
      return {
        attempt: { ...attempt, status: "SUBMITTED" },
        result: { id: "result-1", ...evaluation },
        alreadySubmitted: false,
      };
    },
  };
  const service = new SpeakingUserService(repository as never);

  const submitted = await service.submitAttempt("user-1", "attempt-1", {
    q2: { audioUrl: "https://storage.example/q2.webm", durationSeconds: 35 },
  });
  assert.equal(submitted.result.recordingCount, 2);
  assert.deepEqual(completed, {
    recordings: {
      q1: { audioUrl: "https://storage.example/q1.webm", durationSeconds: 25 },
      q2: { audioUrl: "https://storage.example/q2.webm", durationSeconds: 35 },
    },
    evaluation: {
      recordingCount: 2,
      totalQuestions: 2,
      totalDurationSeconds: 60,
      completionPercentage: 100,
      basicScore: 100,
      estimatedBandScore: 7,
      evaluationMode: "BASIC",
      algorithmVersion: "basic-v1",
      feedback: {
        summary:
          "This is a practice-completion estimate based on recorded-answer coverage and duration, not an IELTS speaking assessment.",
        strengths: [
          "You recorded answers for most of the required prompts.",
          "Your average response duration supports developed practice answers.",
        ],
        improvements: [],
      },
    },
  });

  await assert.rejects(
    () =>
      service.submitAttempt("user-1", "attempt-1", {
        anotherTestQuestion: {
          audioUrl: "https://storage.example/invalid.webm",
          durationSeconds: 20,
        },
      }),
    (error: unknown) =>
      error instanceof SpeakingUserServiceError && error.statusCode === 400
  );
});
