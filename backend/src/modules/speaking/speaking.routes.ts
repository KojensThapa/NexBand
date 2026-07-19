import type { FastifyInstance } from "fastify";

import { registerSpeakingAdminRoutes } from "./admin/speaking.admin.route";
import { registerSpeakingUserRoutes } from "./user/speaking.user.route";

export async function registerSpeakingRoutes(fastify: FastifyInstance) {
  await registerSpeakingAdminRoutes(fastify);
  await registerSpeakingUserRoutes(fastify);
}
