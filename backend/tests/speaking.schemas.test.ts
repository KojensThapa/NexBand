import assert from "node:assert/strict";
import test from "node:test";
import {
  createSpeakingMockTestSchema,
  toDatabaseSpeakingCategory,
  toSpeakingCategoryInput,
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
  const result = createSpeakingMockTestSchema.safeParse({
    title: "IELTS Speaking Mock 1",
    category: "mock",
    published: false,
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
  const result = createSpeakingMockTestSchema.safeParse({
    title: "Travel cue card",
    category: "part-2",
    part1: { questions: [] },
    part2: validPart2,
    part3: { topic: "", questions: [] },
  });

  assert.equal(result.success, true);
});

test("requires every section for a full mock test", () => {
  const result = createSpeakingMockTestSchema.safeParse({
    title: "Incomplete mock",
    category: "mock",
    part1: { questions: [{ text: "Where do you live?" }] },
    part2: validPart2,
    part3: { topic: "", questions: [] },
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.issues.some((issue) => issue.path[0] === "part3"));
  }
});

test("maps category names between the frontend and database", () => {
  assert.equal(toDatabaseSpeakingCategory("part-3"), "PART_3");
  assert.equal(toSpeakingCategoryInput("PART_2"), "part-2");
});
