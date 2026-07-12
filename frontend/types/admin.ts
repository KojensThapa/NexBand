export interface Admin {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export type AdminWritingCategory = "mock" | "task-1" | "task-2";

export interface AdminWritingQuestion {
  id: string;
  category: AdminWritingCategory;
  taskNumber: 1 | 2;
  title: string;
  prompt: string;
  typeLabel?: string;
  task1Type?: "graph" | "chart" | "table" | "map" | "process" | "diagram" | "pie";
  imageUrl?: string;
  imageAlt?: string;
  mockTestId?: string;
  mockTestTitle?: string;
  published?: boolean;
  createdAt: string;
}

export type AdminListeningQuestionType =
  | "multiple-choice"
  | "form-completion"
  | "note-completion"
  | "table-completion"
  | "summary-completion"
  | "sentence-completion"
  | "matching"
  | "map-labelling"
  | "short-answer";

export interface AdminListeningQuestion {
  id: string;
  questionNumber: number;
  type: AdminListeningQuestionType;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  marks: number;
}

export interface AdminListeningPart {
  partNumber: 1 | 2 | 3 | 4;
  title: string;
  instruction: string;
  transcript?: string;
  audioUrl?: string;
  audioDurationSeconds: number;
  mapImageUrl?: string;
  mapImageAlt?: string;
  questions: AdminListeningQuestion[];
}

export interface AdminListeningMockTest {
  id: string;
  title: string;
  iconStyle: "headphones" | "broadcast" | "microphone";
  published: boolean;
  parts: AdminListeningPart[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminSpeakingQuestion {
  id: string;
  text: string;
}

export interface AdminSpeakingPart1 {
  questions: AdminSpeakingQuestion[];
}

export interface AdminSpeakingPart2 {
  cueCardTitle: string;
  cueCardDescription: string;
  bulletPoints: string[];
  closingQuestion: string;
  preparationMinutes: number;
  speakingMinutes: number;
}

export interface AdminSpeakingPart3 {
  topic: string;
  questions: AdminSpeakingQuestion[];
}

export type AdminSpeakingCategory = "mock" | "part-1" | "part-2" | "part-3";

export interface AdminSpeakingMockTest {
  id: string;
  title: string;
  category: AdminSpeakingCategory;
  published: boolean;
  part1: AdminSpeakingPart1;
  part2: AdminSpeakingPart2;
  part3: AdminSpeakingPart3;
  createdAt: string;
  updatedAt: string;
}
