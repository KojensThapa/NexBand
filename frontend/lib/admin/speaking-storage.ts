import type {
  AdminSpeakingCategory,
  AdminSpeakingMockTest,
  AdminSpeakingQuestion,
} from "@/types/admin";
import {
  DEFAULT_BULLET_POINT_COUNT,
  DEFAULT_PART1_QUESTION_COUNT,
  DEFAULT_PART3_QUESTION_COUNT,
  DEFAULT_PREP_MINUTES,
  DEFAULT_SPEAK_MINUTES,
} from "./speaking-constants";

export function createEmptySpeakingQuestion(): AdminSpeakingQuestion {
  return {
    id: `sq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: "",
  };
}

export function createEmptyMockTestDraft(
  category: AdminSpeakingMockTest["category"] = "mock"
): Omit<AdminSpeakingMockTest, "id" | "createdAt" | "updatedAt"> {
  return {
    title: "",
    category,
    published: false,
    part1: {
      questions: Array.from({ length: DEFAULT_PART1_QUESTION_COUNT }, () =>
        createEmptySpeakingQuestion()
      ),
    },
    part2: {
      cueCardTitle: "",
      cueCardDescription: "",
      bulletPoints: Array.from({ length: DEFAULT_BULLET_POINT_COUNT }, () => ""),
      closingQuestion: "",
      preparationMinutes: DEFAULT_PREP_MINUTES,
      speakingMinutes: DEFAULT_SPEAK_MINUTES,
    },
    part3: {
      topic: "",
      questions: Array.from({ length: DEFAULT_PART3_QUESTION_COUNT }, () =>
        createEmptySpeakingQuestion()
      ),
    },
  };
}

export function countAdminSpeakingQuestions(test: AdminSpeakingMockTest): number {
  if (test.category === "part-1") {
    return test.part1.questions.length;
  }
  if (test.category === "part-2") {
    return test.part2.closingQuestion.trim() ? 1 : 0;
  }
  if (test.category === "part-3") {
    return test.part3.questions.length;
  }
  return (
    test.part1.questions.length +
    (test.part2.closingQuestion.trim() ? 1 : 0) +
    test.part3.questions.length
  );
}

export function getAdminSpeakingCategoryLabel(category: AdminSpeakingCategory): string {
  switch (category) {
    case "mock":
      return "Mock Test";
    case "part-1":
      return "Part 1";
    case "part-2":
      return "Part 2";
    case "part-3":
      return "Part 3";
  }
}
