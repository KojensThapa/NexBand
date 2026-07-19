export type WritingTaskNumber = 1 | 2;

export type WritingTask1Type =
  | "graph"
  | "chart"
  | "table"
  | "map"
  | "process"
  | "diagram"
  | "pie";

export interface WritingTask {
  /** Stable id, e.g. "task-1" / "task-2". */
  id: string;
  /** Parent test ID for server-published writing tasks. */
  testId?: string;
  /** True when this task is served by the Writing API rather than local demo data. */
  isBackendTest?: boolean;
  /** 1 = report/letter, 2 = essay. */
  taskNumber: WritingTaskNumber;
  /** Short label shown on the tab, e.g. "Task 1". */
  label: string;
  /** Headline shown above the prompt card. */
  title: string;
  /** The full question / instructions shown to the candidate. */
  prompt: string;
  /** Minimum recommended word count (150 for Task 1, 250 for Task 2). */
  minWords: number;
  /** Recommended time in minutes (20 for Task 1, 40 for Task 2). */
  recommendedMinutes: number;
  /** Optional visual (chart/map/process image) for Task 1. */
  imageUrl?: string;
  /** Optional alt text for the visual. */
  imageAlt?: string;
  /** Optional Task 1 question variety. */
  task1Type?: WritingTask1Type;
  /** Display label on task cards, e.g. "Line Graph" or "Opinion Essay". */
  typeLabel?: string;
}

export interface WritingMockTest {
  id: string;
  title: string;
  category?: "mock" | "task-1" | "task-2";
  /** True when this test is served by the Writing API rather than local demo data. */
  isBackendTest?: boolean;
  /** Total time across both tasks, usually 60 minutes. */
  totalMinutes: number;
  tasks: WritingTask[];
}

/** A candidate's response to a single task. */
export interface WritingTaskAnswer {
  taskId: string;
  text: string;
  wordCount: number;
}
