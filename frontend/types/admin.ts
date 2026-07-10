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
  createdAt: string;
}
