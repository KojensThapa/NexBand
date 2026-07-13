import type { AdminReadingPassage, AdminReadingQuestion, AdminReadingTest } from "@/types/admin";
import type {
  ReadingMockTest,
  ReadingPassage,
  ReadingQuestion,
  ReadingQuestionType,
} from "@/types/reading";

function mapQuestionType(type: AdminReadingQuestion["type"]): ReadingQuestionType {
  switch (type) {
    case "multiple-choice":
      return "multiple-choice";
    case "true-false-not-given":
      return "true-false-not-given";
    case "yes-no-not-given":
      return "yes-no-not-given";
    case "short-answer":
      return "short-answer";
    case "matching-headings":
    case "matching-information":
    case "matching-features":
    case "matching-sentence-endings":
      return "matching";
    default:
      return "fill-blank";
  }
}

function getPassageTypeLabel(questions: AdminReadingQuestion[]): string {
  const primaryType = questions[0]?.type;
  if (!primaryType) return "Reading";
  return primaryType
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function adminQuestionToExam(
  question: AdminReadingQuestion,
  testId: string,
  passageId: string
): ReadingQuestion {
  return {
    id: question.id || `${testId}-${passageId}-q${question.questionNumber}`,
    number: question.questionNumber,
    type: mapQuestionType(question.type),
    prompt: question.questionText,
    options: question.options?.filter((option) => option.trim()),
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    marks: question.marks,
  };
}

function adminPassageToExam(passage: AdminReadingPassage, testId: string): ReadingPassage {
  const sortedQuestions = [...passage.questions].sort(
    (a, b) => a.questionNumber - b.questionNumber
  );

  return {
    id: passage.id || `${testId}-passage-${passage.partNumber}`,
    partNumber: passage.partNumber,
    label: `Part ${passage.partNumber}`,
    title: passage.title,
    typeLabel: getPassageTypeLabel(sortedQuestions),
    passage: passage.passageText,
    instruction: passage.instruction,
    imageUrl: passage.imageUrl,
    imageAlt: passage.imageAlt,
    questions: sortedQuestions.map((question) =>
      adminQuestionToExam(question, testId, passage.id)
    ),
    recommendedMinutes: 20,
  };
}

export function adminReadingTestToMock(test: AdminReadingTest): ReadingMockTest {
  return {
    id: test.id,
    title: test.title,
    totalMinutes: test.totalMinutes,
    passages: test.passages
      .sort((a, b) => a.passageOrder - b.passageOrder)
      .map((passage) => adminPassageToExam(passage, test.id)),
  };
}

export function buildAdminReadingMockTests(
  tests: AdminReadingTest[],
  options?: { publishedOnly?: boolean }
): ReadingMockTest[] {
  return tests
    .filter((test) => test.category === "mock")
    .filter((test) => !options?.publishedOnly || test.published)
    .map(adminReadingTestToMock);
}

export function getAdminReadingTaskById(
  tests: AdminReadingTest[],
  testId: string,
  options?: { publishedOnly?: boolean }
): ReadingMockTest | undefined {
  const test = tests.find((item) => item.id === testId);
  if (!test) return undefined;
  if (options?.publishedOnly && !test.published) return undefined;
  if (test.category !== "mock") return undefined;
  return adminReadingTestToMock(test);
}
