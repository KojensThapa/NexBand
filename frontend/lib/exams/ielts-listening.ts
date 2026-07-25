import type { ListeningPart } from "@/types/listening";

export const LISTENING_MOCK_SECONDS = 32 * 60 + 30;
export const LISTENING_PART_SECONDS = 8 * 60 + 30;

export function getListeningTaskHref(
  testId: string,
  options?: { part?: number; backHref?: string }
): string {
  const partPath = options?.part
    ? `/test/ielts/listening/mock/${testId}/part/${options.part}`
    : `/test/ielts/listening/mock/${testId}`;
  if (!options?.backHref) return partPath;
  return `${partPath}?back=${encodeURIComponent(options.backHref)}`;
}

export function countListeningQuestions(part: ListeningPart): number {
  let count = 0;
  for (const row of part.tableRows) {
    for (const cell of row.cells) {
      if (typeof cell === "string") {
        if (cell.includes("__")) count += 1;
        continue;
      }
      for (const segment of cell) {
        if (segment.questionNumber) count += 1;
      }
    }
  }
  return count;
}
