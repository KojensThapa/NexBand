import type { FastifyInstance } from "fastify";

import { parseInput } from "../../core/http/validation";
import type { AppRepositories } from "../../infrastructure/persistence/repositories";
import { authenticate } from "../../plugins/auth";
import { reportIdSchema } from "./report.schemas";
import { ReportService } from "./report.service";

export async function registerReportRoutes(
  app: FastifyInstance,
  repositories: AppRepositories
): Promise<void> {
  const reportService = new ReportService(repositories);

  app.get("/reports", { preHandler: authenticate }, async (request) => {
    const reports = await reportService.listForUser(request.user.sub);
    return { data: reports };
  });

  app.get("/reports/:id", { preHandler: authenticate }, async (request) => {
    const { id } = parseInput(reportIdSchema, request.params);
    const report = await reportService.getForUser(id, request.user.sub);
    return { data: report };
  });
}
