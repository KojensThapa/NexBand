<<<<<<< HEAD
import type { IeltsSkill } from "./exam";

/** The three speaking parts plus the combined full mock test. */
export type SpeakingPartId = "part-1" | "part-2" | "part-3" | "mock";

export type SpeakingBoardMode = SpeakingPartId;

/** A single question shown to the candidate. */
export interface SpeakingQuestion {
  /** Stable id, e.g. "p1-q1". */
  id: string;
  /** The question text. */
  text: string;
}

/**
 * A Part 2 cue card. The candidate is given 1 minute to prepare and
 * 2–3 minutes to speak, then answers follow-up questions.
 */
export interface SpeakingCueCard {
  /** Stable id, e.g. "memorable-trip". */
  id: string;
  /** The main prompt, e.g. "Describe a memorable trip." */
  prompt: string;
  /** Bullet points the candidate should cover ("You should say:"). */
  points: string[];
  /** Optional short label for the topic. */
  topicLabel?: string;
}

/** A topic bundle that links the Part 2 cue card to its Part 3 discussion. */
export interface SpeakingTopicSet {
  /** Stable id, e.g. "travel". */
  id: string;
  /** Display label, e.g. "Travel & Tourism". */
  label: string;
  cueCard: SpeakingCueCard;
  /** Discussion questions for Part 3. */
  discussionQuestions: SpeakingQuestion[];
  /** Follow-up questions asked after the Part 2 long turn. */
  followUpQuestions: SpeakingQuestion[];
}

/** One self-contained speaking practice (a single part or the full mock). */
export interface SpeakingTest {
  id: string;
  part: SpeakingPartId;
  /** Headline shown above the board card / session header. */
  title: string;
  /** Short description shown on the board card. */
  description: string;
  /** Estimated duration label, e.g. "4–5 min". */
  durationLabel: string;
  /** Number of questions shown on the board card. */
  questionCount: number;
  /** Topic sets available for this part/mock. */
  topics: SpeakingTopicSet[];
}

/** A candidate's recorded response to one question. */
export interface SpeakingResponse {
  questionId: string;
  /** Recorded audio object URL (blob), if any. */
  audioUrl?: string | null;
  /** Recorded duration in seconds. */
  durationSeconds: number;
}

export type SpeakingSkill = Extract<IeltsSkill, "speaking">;
=======
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
>>>>>>> dd93bf638b3a9424786982ca72ef20d8ee1d2be5
