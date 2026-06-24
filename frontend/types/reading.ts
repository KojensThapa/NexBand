export type ReadingPartNumber = 1 | 2 | 3;

export type ReadingQuestionType =
  | "true-false-not-given"
  | "multiple-choice"
  | "fill-blank"
  | "yes-no-not-given";

export interface ReadingQuestion {
  id: string;
  number: number;
  type: ReadingQuestionType;
  prompt: string;
  options?: string[];
}

export interface ReadingPassage {
  id: string;
  partNumber: ReadingPartNumber;
  label: string;
  title: string;
  typeLabel: string;
  passage: string;
  questions: ReadingQuestion[];
  recommendedMinutes: number;
}

export interface ReadingMockTest {
  id: string;
  title: string;
  totalMinutes: number;
  passages: ReadingPassage[];
}

export interface ReadingAnswer {
  questionId: string;
  value: string;
}
