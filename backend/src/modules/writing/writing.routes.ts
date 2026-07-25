import { FastifyInstance } from "fastify";
import { registerWritingAdminRoutes } from "./admin/writing.admin.route";
import { registerWritingUserRoutes } from "./user/writing.user.route";
import { registerWritingEvaluationRoutes } from "./routes/writing.routes";

export async function registerWritingRoutes(fastify: FastifyInstance) {
  await registerWritingAdminRoutes(fastify);
  await registerWritingUserRoutes(fastify);
  await registerWritingEvaluationRoutes(fastify);
}
