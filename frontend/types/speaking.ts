export type SpeakingPartNumber = 1 | 2 | 3;

export type SpeakingBoardMode = "mock" | "part-1" | "part-2" | "part-3";

export interface SpeakingQuestion {
  id: string;
  text: string;
}

export interface SpeakingCueCard {
  topic: string;
  prompt: string;
  bulletPoints: string[];
  /** Optional follow-up questions after the long turn */
  followUpQuestions: SpeakingQuestion[];
}

export interface SpeakingPart1 {
  partNumber: 1;
  label: string;
  durationMinutes: number;
  questions: SpeakingQuestion[];
}

export interface SpeakingPart2 {
  partNumber: 2;
  label: string;
  prepMinutes: number;
  speakMinutes: number;
  cueCard: SpeakingCueCard;
}

export interface SpeakingPart3 {
  partNumber: 3;
  label: string;
  durationMinutes: number;
  topic: string;
  questions: SpeakingQuestion[];
}

export interface SpeakingMockTest {
  id: string;
  title: string;
  typeLabel: string;
  totalMinutes: number;
  part1: SpeakingPart1;
  part2: SpeakingPart2;
  part3: SpeakingPart3;
}

/** Standalone Part 1 practice set */
export interface SpeakingPart1Task {
  id: string;
  title: string;
  typeLabel: string;
  part1: SpeakingPart1;
}

/** Standalone Part 2 cue-card practice */
export interface SpeakingPart2Task {
  id: string;
  title: string;
  typeLabel: string;
  part2: SpeakingPart2;
}

/** Standalone Part 3 discussion practice */
export interface SpeakingPart3Task {
  id: string;
  title: string;
  typeLabel: string;
  part3: SpeakingPart3;
}

export interface SpeakingRecording {
  audioUrl: string;
  durationSeconds: number;
}
