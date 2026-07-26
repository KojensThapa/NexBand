import path from "node:path";
import { createHash } from "node:crypto";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import staticFiles from "@fastify/static";
import jwtPlugin from "./plugins/jwt";
import { registerReadingRoutes } from "./modules/reading/reading.routes";
import { registerListeningRoutes } from "./modules/listening/listening.routes";
import { registerSpeakingRoutes } from "./modules/speaking/speaking.routes";
import { registerWritingRoutes } from "./modules/writing/writing.routes";
import { registerUploadRoutes } from "./modules/uploads/uploads.routes";

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
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // The learner app and API are commonly served from different origins during
  // development and deployment. Uploaded listening audio must therefore be
  // embeddable by the learner's <audio> element.
  await app.register(helmet, {
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  await app.register(rateLimit, {
    // Audio recording, autosave, and report submission create several API
    // requests in one session. Rate-limit each signed-in session separately
    // instead of making every learner on one network share a 100-request cap.
    max: 600,
    timeWindow: "1 minute",
    keyGenerator: (request) => {
      const authorization = request.headers.authorization;
      if (!authorization) return request.ip;
      return createHash("sha256").update(authorization).digest("hex");
    },
  });

  await app.register(jwtPlugin);

  await app.register(multipart, {
    limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  });

  await app.register(staticFiles, {
    root: path.join(__dirname, "..", "uploads"),
    prefix: "/uploads/",
  });

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

  await app.register(registerUploadRoutes, {
    prefix: "/api/uploads",
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
