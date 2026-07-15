import type { Exam, IeltsSkill, Report, StoredUser, Submission } from "../../shared/domain";

export interface UserRepository {
  create(user: StoredUser): Promise<StoredUser>;
  findByEmail(email: string): Promise<StoredUser | undefined>;
  findById(id: string): Promise<StoredUser | undefined>;
}

export interface ExamRepository {
  create(exam: Exam): Promise<Exam>;
  findById(id: string): Promise<Exam | undefined>;
  list(filters?: { skill?: IeltsSkill; published?: boolean }): Promise<Exam[]>;
  update(id: string, changes: Partial<Exam>): Promise<Exam | undefined>;
  delete(id: string): Promise<boolean>;
}

export interface SubmissionRepository {
  create(submission: Submission): Promise<Submission>;
  findById(id: string): Promise<Submission | undefined>;
  listByUserId(userId: string): Promise<Submission[]>;
  update(id: string, changes: Partial<Submission>): Promise<Submission | undefined>;
}

export interface ReportRepository {
  create(report: Report): Promise<Report>;
  findById(id: string): Promise<Report | undefined>;
  listByUserId(userId: string): Promise<Report[]>;
  update(id: string, changes: Partial<Report>): Promise<Report | undefined>;
}

export interface AppRepositories {
  users: UserRepository;
  exams: ExamRepository;
  submissions: SubmissionRepository;
  reports: ReportRepository;
}
