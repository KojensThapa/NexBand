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
