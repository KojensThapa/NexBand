import { randomUUID } from "node:crypto";

import { AppError } from "../../core/errors/app-error";
import type { AppRepositories } from "../../infrastructure/persistence/repositories";
import { toPublicExam, type Exam, type IeltsSkill, type PublicExam } from "../../shared/domain";
import type { CreateExamInput, UpdateExamInput } from "./exam.schemas";

export class ExamService {
  constructor(private readonly repositories: AppRepositories) {}

  async listPublished(skill?: IeltsSkill): Promise<PublicExam[]> {
    const exams = await this.repositories.exams.list({ skill, published: true });
    return exams.map(toPublicExam);
  }

  async getPublished(id: string): Promise<PublicExam> {
    const exam = await this.repositories.exams.findById(id);
    if (!exam || !exam.published) {
      throw AppError.notFound("Test");
    }

    return toPublicExam(exam);
  }

  async listForAdmin(skill?: IeltsSkill): Promise<Exam[]> {
    return this.repositories.exams.list({ skill });
  }

  async create(input: CreateExamInput, adminId: string): Promise<Exam> {
    const now = new Date().toISOString();
    const exam: Exam = {
      id: randomUUID(),
      ...input,
      createdBy: adminId,
      createdAt: now,
      updatedAt: now,
    };

    return this.repositories.exams.create(exam);
  }

  async update(id: string, input: UpdateExamInput): Promise<Exam> {
    const existing = await this.repositories.exams.findById(id);
    if (!existing) {
      throw AppError.notFound("Test");
    }

    const updated = await this.repositories.exams.update(id, {
      ...input,
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      throw AppError.notFound("Test");
    }

    return updated;
  }

  async setPublished(id: string, published: boolean): Promise<Exam> {
    return this.update(id, { published });
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repositories.exams.delete(id);
    if (!deleted) {
      throw AppError.notFound("Test");
    }
  }
}
