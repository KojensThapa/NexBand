import type { FastifyInstance } from "fastify";

import { registerSpeakingAdminRoutes } from "./admin/speaking.admin.route";
import { registerSpeakingEvaluationRoutes } from "./routes/speaking.routes";
import { registerSpeakingUserRoutes } from "./user/speaking.user.route";

export async function registerSpeakingRoutes(fastify: FastifyInstance) {
  await registerSpeakingAdminRoutes(fastify);
  await registerSpeakingUserRoutes(fastify);
  await registerSpeakingEvaluationRoutes(fastify);
}
