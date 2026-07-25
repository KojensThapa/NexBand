import type { WordCountMetrics, WritingTaskNumber } from "./types";

const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu;

export function extractWords(text: string): string[] {
  return text.match(WORD_PATTERN)?.map((word) => word.toLocaleLowerCase("en-US")) ?? [];
}

export function minimumWordCount(taskNumber: WritingTaskNumber): number {
  return taskNumber === 1 ? 150 : 250;
}

/** Applies a bounded band penalty only when the IELTS minimum is not met. */
export function calculateWordCount(text: string, taskNumber: WritingTaskNumber): WordCountMetrics {
  const wordCount = extractWords(text).length;
  const minimum = minimumWordCount(taskNumber);
  const shortfallRatio = wordCount >= minimum ? 0 : (minimum - wordCount) / minimum;

  return {
    wordCount,
    minimumWordCount: minimum,
    isBelowMinimum: shortfallRatio > 0,
    wordCountPenalty: Number(Math.min(2, shortfallRatio * 2).toFixed(2)),
  };
}

