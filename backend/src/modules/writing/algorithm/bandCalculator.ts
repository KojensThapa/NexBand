import type { CefrLevel } from "./types";

export function roundToHalfBand(score: number): number {
  return Number((Math.round(Math.max(0, Math.min(9, score)) * 2) / 2).toFixed(1));
}

/** Task 2 is weighted twice as heavily when creating a full IELTS mock report. */
export function calculateOverallBand(scores: {
  taskAchievement: number;
  coherence: number;
  vocabulary: number;
  grammar: number;
}): number {
  return roundToHalfBand(
    (scores.taskAchievement + scores.coherence + scores.vocabulary + scores.grammar) / 4
  );
}

export function calculateMockOverallBand(taskBands: ReadonlyArray<{ taskNumber: 1 | 2; overallBand: number }>): number {
  const taskOne = taskBands.find((report) => report.taskNumber === 1);
  const taskTwo = taskBands.find((report) => report.taskNumber === 2);
  if (!taskOne || !taskTwo) return taskBands[0]?.overallBand ?? 0;
  return roundToHalfBand((taskOne.overallBand + taskTwo.overallBand * 2) / 3);
}

export function calculateCefrLevel(overallBand: number): CefrLevel {
  if (overallBand >= 8.5) return "C2";
  if (overallBand >= 7) return "C1";
  if (overallBand >= 5.5) return "B2";
  if (overallBand >= 4) return "B1";
  if (overallBand >= 3) return "A2";
  return "A1";
}

