import type { FastifyInstance } from "fastify";

import { registerListeningAdminRoutes } from "./admin/listening.admin.route";
import { registerListeningUserRoutes } from "./user/listening.user.route";

export async function registerListeningRoutes(fastify: FastifyInstance) {
  await registerListeningAdminRoutes(fastify);
  await registerListeningUserRoutes(fastify);
}
