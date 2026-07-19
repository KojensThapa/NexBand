import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import jwtPlugin from "./plugins/jwt";
import { registerReadingRoutes } from "./modules/reading/reading.routes";
import { registerListeningRoutes } from "./modules/listening/listening.routes";
import { registerSpeakingRoutes } from "./modules/speaking/speaking.routes";
import { registerWritingRoutes } from "./modules/writing/writing.routes";

import { registerAuthRoutes } from "./modules/auth/auth.routes";

export async function buildApp() {
  const app = Fastify({
    logger: true,
    // Writing Task 1 accepts the admin form's 5 MB image uploads as base64
    // data URLs, which are larger than Fastify's default 1 MB JSON limit.
    bodyLimit: 10 * 1024 * 1024,
  });

  // Security
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(helmet);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(jwtPlugin);

  // Routes
  await app.register(registerAuthRoutes, {
    prefix: "/api/auth",
  });

  await app.register(registerReadingRoutes, {
    prefix: "/api/reading",
  });

  await app.register(registerListeningRoutes, {
    prefix: "/api/listening",
  });

  await app.register(registerSpeakingRoutes, {
    prefix: "/api/speaking",
  });

  await app.register(registerWritingRoutes, {
    prefix: "/api/writing",
  });

  // Health Check
  app.get("/", async () => {
    return {
      success: true,
      message: "NexBand Backend API is running 🚀",
    };
  });

  return app;
}
