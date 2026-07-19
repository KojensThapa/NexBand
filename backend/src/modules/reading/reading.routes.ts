import type { FastifyInstance } from "fastify";

import { registerReadingAdminRoutes } from "./admin/reading.admin.route";
import { registerReadingUserRoutes } from "./user/reading.user.route";

/** Registers the separately maintained admin and learner Reading APIs. */
export async function registerReadingRoutes(fastify: FastifyInstance) {
  await registerReadingAdminRoutes(fastify);
  await registerReadingUserRoutes(fastify);
}
