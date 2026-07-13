import type { AdminReadingQuestionType } from "@/types/admin";

export const DEFAULT_READING_TOTAL_QUESTIONS = 40;
export const DEFAULT_READING_TOTAL_MINUTES = 60;
export const DEFAULT_QUESTIONS_PER_PASSAGE = 13;
export const MAX_READING_IMAGE_SIZE_MB = 5;

export const READING_QUESTION_TYPE_OPTIONS: {
  value: AdminReadingQuestionType;
  label: string;
}[] = [
  { value: "multiple-choice", label: "Multiple Choice" },
  { value: "true-false-not-given", label: "True / False / Not Given" },
  { value: "yes-no-not-given", label: "Yes / No / Not Given" },
  { value: "matching-headings", label: "Matching Headings" },
  { value: "matching-information", label: "Matching Information" },
  { value: "matching-features", label: "Matching Features" },
  { value: "matching-sentence-endings", label: "Matching Sentence Endings" },
  { value: "sentence-completion", label: "Sentence Completion" },
  { value: "summary-completion", label: "Summary Completion" },
  { value: "note-completion", label: "Note Completion" },
  { value: "table-completion", label: "Table Completion" },
  { value: "flow-chart-completion", label: "Flow Chart Completion" },
  { value: "diagram-labelling", label: "Diagram Labelling" },
  { value: "short-answer", label: "Short Answer" },
];

export const READING_TYPES_WITH_OPTIONS = new Set<AdminReadingQuestionType>([
  "multiple-choice",
  "true-false-not-given",
  "yes-no-not-given",
  "matching-headings",
  "matching-information",
  "matching-features",
  "matching-sentence-endings",
]);

export const DEFAULT_TFNG_OPTIONS = ["TRUE", "FALSE", "NOT GIVEN"];
export const DEFAULT_YNNG_OPTIONS = ["YES", "NO", "NOT GIVEN"];

export function getDefaultOptionsForType(
  type: AdminReadingQuestionType
): string[] | undefined {
  if (type === "true-false-not-given") return [...DEFAULT_TFNG_OPTIONS];
  if (type === "yes-no-not-given") return [...DEFAULT_YNNG_OPTIONS];
  if (READING_TYPES_WITH_OPTIONS.has(type)) return ["", "", ""];
  return undefined;
}

export function getAdminReadingCategoryLabel(): string {
  return "Mock Test";
}
