import type { FastifyInstance } from "fastify";

import type { AppConfig } from "../../config/env";

export async function registerHealthRoutes(app: FastifyInstance, config: AppConfig): Promise<void> {
  app.get("/", async () => ({
    data: {
      name: "NexBand API",
      version: "v1",
      documentation: "/docs/API.md",
    },
  }));

  app.get("/health", async () => ({
    data: {
      status: "ok",
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  }));
}
