export type WritingBoardMode = "mock" | "task-1" | "task-2";

export function getWritingTaskHref(
  mode: WritingBoardMode,
  id: string,
  backHref?: string
): string {
  const base = `/test/ielts/writing/${mode}/${id}`;
  if (!backHref) return base;
  return `${base}?back=${encodeURIComponent(backHref)}`;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
