export const IELTS_SKILLS = ["writing", "reading", "listening", "speaking"] as const;

export type IeltsSkill = (typeof IELTS_SKILLS)[number];
export type UserRole = "student" | "admin";
export type ExamCategory = "practice" | "mock";
export type SubmissionStatus = "processing" | "completed" | "failed";
export type ReportStatus = "pending" | "completed" | "failed";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface StoredUser extends User {
  passwordHash: string;
}

export interface Exam {
  id: string;
  skill: IeltsSkill;
  category: ExamCategory;
  title: string;
  description?: string;
  /** Public task content. Keep answer keys and scoring rules out of this field. */
  content: Record<string, unknown>;
  /** Admin-only marking data, never included in public test responses. */
  answerKey: Record<string, unknown>;
  published: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type PublicExam = Omit<Exam, "answerKey">;

export interface Submission {
  id: string;
  userId: string;
  examId?: string;
  skill: IeltsSkill;
  answers: Record<string, unknown>;
  responseText?: string;
  timeTakenSeconds?: number;
  status: SubmissionStatus;
  reportId?: string;
  submittedAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  submissionId: string;
  userId: string;
  skill: IeltsSkill;
  status: ReportStatus;
  score?: number;
  summary?: string;
  /** Skill-specific analysis returned after the analysis worker completes. */
  detail?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function toPublicUser(user: User): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function toPublicExam(exam: Exam): PublicExam {
  const { answerKey: _answerKey, ...publicExam } = exam;
  return publicExam;
}
