import type { Exam, IeltsSkill, Report, StoredUser, Submission } from "../../shared/domain";
import type {
  AppRepositories,
  ExamRepository,
  ReportRepository,
  SubmissionRepository,
  UserRepository,
} from "./repositories";

function copy<T>(value: T): T {
  return structuredClone(value);
}

class MemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, StoredUser>();

  async create(user: StoredUser): Promise<StoredUser> {
    this.users.set(user.id, copy(user));
    return copy(user);
  }

  async findByEmail(email: string): Promise<StoredUser | undefined> {
    const user = Array.from(this.users.values()).find((candidate) => candidate.email === email);
    return user ? copy(user) : undefined;
  }

  async findById(id: string): Promise<StoredUser | undefined> {
    const user = this.users.get(id);
    return user ? copy(user) : undefined;
  }
}

class MemoryExamRepository implements ExamRepository {
  private readonly exams = new Map<string, Exam>();

  async create(exam: Exam): Promise<Exam> {
    this.exams.set(exam.id, copy(exam));
    return copy(exam);
  }

  async findById(id: string): Promise<Exam | undefined> {
    const exam = this.exams.get(id);
    return exam ? copy(exam) : undefined;
  }

  async list(filters: { skill?: IeltsSkill; published?: boolean } = {}): Promise<Exam[]> {
    return Array.from(this.exams.values())
      .filter((exam) => filters.skill === undefined || exam.skill === filters.skill)
      .filter((exam) => filters.published === undefined || exam.published === filters.published)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map(copy);
  }

  async update(id: string, changes: Partial<Exam>): Promise<Exam | undefined> {
    const existing = this.exams.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...copy(changes), id };
    this.exams.set(id, updated);
    return copy(updated);
  }

  async delete(id: string): Promise<boolean> {
    return this.exams.delete(id);
  }
}

class MemorySubmissionRepository implements SubmissionRepository {
  private readonly submissions = new Map<string, Submission>();

  async create(submission: Submission): Promise<Submission> {
    this.submissions.set(submission.id, copy(submission));
    return copy(submission);
  }

  async findById(id: string): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    return submission ? copy(submission) : undefined;
  }

  async listByUserId(userId: string): Promise<Submission[]> {
    return Array.from(this.submissions.values())
      .filter((submission) => submission.userId === userId)
      .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))
      .map(copy);
  }

  async update(id: string, changes: Partial<Submission>): Promise<Submission | undefined> {
    const existing = this.submissions.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...copy(changes), id };
    this.submissions.set(id, updated);
    return copy(updated);
  }
}

class MemoryReportRepository implements ReportRepository {
  private readonly reports = new Map<string, Report>();

  async create(report: Report): Promise<Report> {
    this.reports.set(report.id, copy(report));
    return copy(report);
  }

  async findById(id: string): Promise<Report | undefined> {
    const report = this.reports.get(id);
    return report ? copy(report) : undefined;
  }

  async listByUserId(userId: string): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter((report) => report.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(copy);
  }

  async update(id: string, changes: Partial<Report>): Promise<Report | undefined> {
    const existing = this.reports.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...copy(changes), id };
    this.reports.set(id, updated);
    return copy(updated);
  }
}

/**
 * Local-development and test adapter. It deliberately does not persist data.
 * Replace this factory with a Postgres-backed implementation before deployment;
 * the rest of the application depends only on the repository interfaces.
 */
export function createMemoryRepositories(): AppRepositories {
  return {
    users: new MemoryUserRepository(),
    exams: new MemoryExamRepository(),
    submissions: new MemorySubmissionRepository(),
    reports: new MemoryReportRepository(),
  };
}
