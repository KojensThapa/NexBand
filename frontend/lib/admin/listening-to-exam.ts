import type { ListeningMockTest, ListeningPart } from "@/types/listening";

export function getPartQuestionOffset(
  mockTest: ListeningMockTest,
  partNumber: number
): number {
  let offset = 0;
  for (const part of mockTest.parts.sort((a, b) => a.partNumber - b.partNumber)) {
    if (part.partNumber >= partNumber) break;
    offset += countPartQuestions(part);
  }
  return offset;
}

export function countPartQuestions(part: ListeningPart): number {
  let count = 0;
  for (const row of part.tableRows) {
    for (const cell of row.cells) {
      if (typeof cell === "string") continue;
      for (const segment of cell) {
        if (segment.questionNumber) count += 1;
      }
    }
  }
  return count;
}

export function countMockTestQuestions(mockTest: ListeningMockTest): number {
  return mockTest.parts.reduce((total, part) => total + countPartQuestions(part), 0);
}
