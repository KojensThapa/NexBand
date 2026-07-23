export type ReadingPartNumber = 1 | 2 | 3;

export type ReadingQuestionType =
  | "true-false-not-given"
  | "multiple-choice"
  | "fill-blank"
  | "yes-no-not-given"
  | "matching"
  | "short-answer";

export interface ReadingQuestion {
  id: string;
  number: number;
  type: ReadingQuestionType;
  prompt: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  marks?: number;
}

export interface ReadingPassage {
  id: string;
  partNumber: ReadingPartNumber;
  label: string;
  title: string;
  typeLabel: string;
  passage: string;
  instruction?: string;
  imageUrl?: string;
  imageAlt?: string;
  questions: ReadingQuestion[];
  recommendedMinutes: number;
}

export interface ReadingMockTest {
  id: string;
  title: string;
  totalMinutes: number;
  passages: ReadingPassage[];
  /** True only for a published backend test with a persisted attempt and report. */
  isBackendTest?: boolean;
}

export interface ReadingAnswer {
  questionId: string;
  value: string;
}
