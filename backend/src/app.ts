import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";

import { loadConfig, type AppConfig } from "./config/env";
import { registerErrorHandler } from "./core/http/error-handler";
import { createMemoryRepositories } from "./infrastructure/persistence/memory-repositories";
import type { AppRepositories } from "./infrastructure/persistence/repositories";
import { registerAuthRoutes } from "./modules/auth/auth.routes";
import { registerExamRoutes } from "./modules/exams/exam.routes";
import { registerHealthRoutes } from "./modules/health/health.routes";
import { registerReportRoutes } from "./modules/reports/report.routes";
import { registerSubmissionRoutes } from "./modules/submissions/submission.routes";

export interface BuildAppOptions {
  config?: AppConfig;
  repositories?: AppRepositories;
  logger?: FastifyServerOptions["logger"];
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadConfig();
  const repositories = options.repositories ?? createMemoryRepositories();
  const app = Fastify({
    logger: options.logger ?? (config.nodeEnv === "test" ? false : { level: config.logLevel }),
    trustProxy: config.trustProxy,
  });

  registerErrorHandler(app);

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: false,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  await app.register(jwt, { secret: config.jwtSecret });

  await app.register(async (instance) => registerHealthRoutes(instance, config), {
    prefix: "/api/v1",
  });
  await app.register(
    async (instance) => registerAuthRoutes(instance, { config, repositories }),
    { prefix: "/api/v1/auth" }
  );
  await app.register(async (instance) => registerExamRoutes(instance, repositories), {
    prefix: "/api/v1",
  });
  await app.register(async (instance) => registerSubmissionRoutes(instance, repositories), {
    prefix: "/api/v1",
  });
  await app.register(async (instance) => registerReportRoutes(instance, repositories), {
    prefix: "/api/v1",
  });

  return app;
}
