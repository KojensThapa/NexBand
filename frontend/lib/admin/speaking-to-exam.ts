import type { AdminSpeakingMockTest } from "@/types/admin";
import type {
  SpeakingMockTest,
  SpeakingPart1Task,
  SpeakingPart2Task,
  SpeakingPart3Task,
} from "@/types/speaking";

function toSpeakingQuestionId(testId: string, part: string, index: number) {
  return `${testId}-${part}-q${index + 1}`;
}

function buildPart1(test: AdminSpeakingMockTest) {
  return {
    partNumber: 1 as const,
    label: "Part 1 — Introduction",
    durationMinutes: 5,
    questions: test.part1.questions.map((question, index) => ({
      id: question.id || toSpeakingQuestionId(test.id, "p1", index),
      text: question.text,
    })),
  };
}

function buildPart2(test: AdminSpeakingMockTest) {
  const filledBullets = test.part2.bulletPoints.filter((point) => point.trim());
  const followUpQuestions = test.part2.closingQuestion.trim()
    ? [
        {
          id: `${test.id}-p2-closing`,
          text: test.part2.closingQuestion.trim(),
        },
      ]
    : [];

  return {
    partNumber: 2 as const,
    label: "Part 2 — Long Turn",
    prepMinutes: test.part2.preparationMinutes,
    speakMinutes: test.part2.speakingMinutes,
    cueCard: {
      topic: test.part2.cueCardTitle.trim(),
      prompt:
        test.part2.cueCardDescription.trim() || test.part2.cueCardTitle.trim(),
      bulletPoints: filledBullets,
      followUpQuestions,
    },
  };
}

function buildPart3(test: AdminSpeakingMockTest) {
  return {
    partNumber: 3 as const,
    label: "Part 3",
    durationMinutes: 5,
    topic: test.part3.topic.trim() || "Discussion",
    questions: test.part3.questions.map((question, index) => ({
      id: question.id || toSpeakingQuestionId(test.id, "p3", index),
      text: question.text,
    })),
  };
}

export function adminSpeakingTestToExam(test: AdminSpeakingMockTest): SpeakingMockTest {
  const part2 = buildPart2(test);
  const totalMinutes = 5 + part2.prepMinutes + part2.speakMinutes + 5;

  return {
    id: test.id,
    title: test.title,
    typeLabel: test.published ? "Full Mock Test" : "Draft",
    totalMinutes,
    part1: buildPart1(test),
    part2,
    part3: buildPart3(test),
  };
}

export function adminSpeakingToPart1Task(test: AdminSpeakingMockTest): SpeakingPart1Task {
  return {
    id: test.id,
    title: test.title,
    typeLabel: "Part 1 · ~5 min",
    part1: buildPart1(test),
  };
}

export function adminSpeakingToPart2Task(test: AdminSpeakingMockTest): SpeakingPart2Task {
  const part2 = buildPart2(test);
  return {
    id: test.id,
    title: test.title,
    typeLabel: `Cue Card · ${part2.prepMinutes} min prep + ${part2.speakMinutes} min`,
    part2,
  };
}

export function adminSpeakingToPart3Task(test: AdminSpeakingMockTest): SpeakingPart3Task {
  const part3 = buildPart3(test);
  return {
    id: test.id,
    title: test.title,
    typeLabel: "Part 3 · ~5 min",
    part3,
  };
}

export function buildAdminSpeakingMockTests(
  tests: AdminSpeakingMockTest[],
  options?: { publishedOnly?: boolean }
): SpeakingMockTest[] {
  const filtered = tests.filter((test) => {
    if (test.category !== "mock") return false;
    if (options?.publishedOnly && !test.published) return false;
    return true;
  });

  return filtered.map(adminSpeakingTestToExam);
}

export function buildAdminSpeakingPart1Tasks(
  tests: AdminSpeakingMockTest[],
  options?: { publishedOnly?: boolean }
): SpeakingPart1Task[] {
  return tests
    .filter(
      (test) =>
        test.category === "part-1" && (!options?.publishedOnly || test.published)
    )
    .map(adminSpeakingToPart1Task);
}

export function buildAdminSpeakingPart2Tasks(
  tests: AdminSpeakingMockTest[],
  options?: { publishedOnly?: boolean }
): SpeakingPart2Task[] {
  return tests
    .filter(
      (test) =>
        test.category === "part-2" && (!options?.publishedOnly || test.published)
    )
    .map(adminSpeakingToPart2Task);
}

export function buildAdminSpeakingPart3Tasks(
  tests: AdminSpeakingMockTest[],
  options?: { publishedOnly?: boolean }
): SpeakingPart3Task[] {
  return tests
    .filter(
      (test) =>
        test.category === "part-3" && (!options?.publishedOnly || test.published)
    )
    .map(adminSpeakingToPart3Task);
}

export function getAdminSpeakingTaskById(
  tests: AdminSpeakingMockTest[],
  mode: "mock" | "part-1" | "part-2" | "part-3",
  testId: string,
  options?: { publishedOnly?: boolean }
) {
  const test = tests.find((item) => item.id === testId);
  if (!test) return undefined;
  if (options?.publishedOnly && !test.published) return undefined;

  if (mode === "mock" && test.category === "mock") {
    return adminSpeakingTestToExam(test);
  }
  if (mode === "part-1" && test.category === "part-1") {
    return adminSpeakingToPart1Task(test);
  }
  if (mode === "part-2" && test.category === "part-2") {
    return adminSpeakingToPart2Task(test);
  }
  if (mode === "part-3" && test.category === "part-3") {
    return adminSpeakingToPart3Task(test);
  }

  return undefined;
}
