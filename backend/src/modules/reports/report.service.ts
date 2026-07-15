import { AppError } from "../../core/errors/app-error";
import type { AppRepositories } from "../../infrastructure/persistence/repositories";
import type { Report } from "../../shared/domain";

export class ReportService {
  constructor(private readonly repositories: AppRepositories) {}

  async listForUser(userId: string): Promise<Report[]> {
    return this.repositories.reports.listByUserId(userId);
  }

  async getForUser(id: string, userId: string): Promise<Report> {
    const report = await this.repositories.reports.findById(id);
    if (!report) {
      throw AppError.notFound("Report");
    }
    if (report.userId !== userId) {
      throw AppError.forbidden("You cannot access this report.");
    }

    return report;
  }
}
