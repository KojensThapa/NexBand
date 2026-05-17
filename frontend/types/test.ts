import type { ExamType, IeltsSkill } from "./exam";

export type TestStatus = "in_progress" | "submitted" | "graded";

export interface TestSession {
  id: string;
  userId: string;
  examType: ExamType;
  skill: IeltsSkill;
  status: TestStatus;
  startedAt: string;
  submittedAt?: string;
}
