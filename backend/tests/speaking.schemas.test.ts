import assert from "node:assert/strict";
import test from "node:test";
import {
  createSpeakingTestSchema,
  speakingRecordingsSchema,
  publishedSpeakingTestsQuerySchema,
} from "../src/modules/speaking/speaking.schemas";

const validPart2 = {
  cueCardTitle: "A memorable journey",
  cueCardDescription: "Describe a journey that you remember clearly.",
  bulletPoints: ["Where you went", "Who you travelled with", "What happened"],
  closingQuestion: "Would you like to take the same journey again?",
  preparationMinutes: 1,
  speakingMinutes: 2,
};

test("accepts the frontend's full speaking mock-test workflow", () => {
  const result = createSpeakingTestSchema.safeParse({
    title: "IELTS Speaking Mock 1",
    category: "mock",
    part1: {
      questions: [{ id: "p1-question", text: "Where do you live?" }],
    },
    part2: validPart2,
    part3: {
      topic: "Travel",
      questions: [{ id: "p3-question", text: "How has travel changed?" }],
    },
  });

  assert.equal(result.success, true);
});

test("accepts a standalone Part 2 item while preserving empty unused parts", () => {
  const result = createSpeakingTestSchema.safeParse({
    title: "Travel cue card",
    category: "part-2",
    part1: { questions: [] },
    part2: validPart2,
    part3: { topic: "", questions: [] },
  });

  assert.equal(result.success, true);
});

test("rejects invalid published test query limits", () => {
  const result = publishedSpeakingTestsQuerySchema.safeParse({
    page: 1,
    limit: 51,
  });

  assert.equal(result.success, false);
});

test("accepts valid speaking recordings with audioUrl or audioStorageKey", () => {
  const withUrl = speakingRecordingsSchema.safeParse({
    "part-1-q1": {
      audioUrl: "https://example.com/recording.webm",
      durationSeconds: 45,
    },
  });
  assert.equal(withUrl.success, true);

  const withKey = speakingRecordingsSchema.safeParse({
    "part-2-cue-card": {
      audioStorageKey: "speaking/user-1/attempt-1/part-2.webm",
      durationSeconds: 120,
    },
  });
  assert.equal(withKey.success, true);

  const missingAudio = speakingRecordingsSchema.safeParse({
    "part-1-q1": {
      durationSeconds: 45,
    },
  });
  assert.equal(missingAudio.success, false);
});
