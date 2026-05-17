import type { ExamType, IeltsSkill } from "./exam";

export interface SkillFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
}

export interface TestResult {
  id: string;
  testId: string;
  userId: string;
  examType: ExamType;
  skill: IeltsSkill;
  bandScore: number;
  feedback: SkillFeedback;
  createdAt: string;
}
