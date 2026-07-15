import { randomUUID } from "node:crypto";

import { AppError } from "../../core/errors/app-error";
import type { AppRepositories } from "../../infrastructure/persistence/repositories";
import type { Report, Submission } from "../../shared/domain";
import type { SubmitExamInput } from "./submission.schemas";

export class SubmissionService {
  constructor(private readonly repositories: AppRepositories) {}

  async submit(userId: string, input: SubmitExamInput): Promise<Submission> {
    if (input.testId) {
      const test = await this.repositories.exams.findById(input.testId);
      if (!test || !test.published) {
        throw AppError.notFound("Test");
      }
      if (test.skill !== input.skill) {
        throw AppError.badRequest("The submitted skill does not match the selected test.");
      }
    }

    const now = new Date().toISOString();
    const report: Report = {
      id: randomUUID(),
      submissionId: "",
      userId,
      skill: input.skill,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    const submission: Submission = {
      id: randomUUID(),
      userId,
      examId: input.testId,
      skill: input.skill,
      answers: input.answers,
      responseText: input.responseText,
      timeTakenSeconds: input.timeTakenSeconds,
      status: "processing",
      reportId: report.id,
      submittedAt: now,
      updatedAt: now,
    };

    report.submissionId = submission.id;
    await this.repositories.reports.create(report);
    return this.repositories.submissions.create(submission);
  }

  async listForUser(userId: string): Promise<Submission[]> {
    return this.repositories.submissions.listByUserId(userId);
  }

  async getForUser(id: string, userId: string): Promise<Submission> {
    const submission = await this.repositories.submissions.findById(id);
    if (!submission) {
      throw AppError.notFound("Submission");
    }
    if (submission.userId !== userId) {
      throw AppError.forbidden("You cannot access this submission.");
    }

    return submission;
  }
}
