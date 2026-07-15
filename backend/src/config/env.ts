import "dotenv/config";

import { z } from "zod";

function environmentBoolean(defaultValue: "true" | "false") {
  return z
    .enum(["true", "false"])
    .default(defaultValue)
    .transform((value) => value === "true");
}

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGIN: z.string().url().default("http://localhost:3000"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must contain at least 32 characters.")
    .default("development-only-secret-change-before-production"),
  JWT_EXPIRES_IN: z.string().min(2).default("7d"),
  ALLOW_ADMIN_REGISTRATION: environmentBoolean("true"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  TRUST_PROXY: environmentBoolean("false"),
});

export interface AppConfig {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  corsOrigin: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  allowAdminRegistration: boolean;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
  trustProxy: boolean;
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.parse(environment);

  if (parsed.NODE_ENV === "production" && parsed.JWT_SECRET.startsWith("development-only")) {
    throw new Error("Set a unique JWT_SECRET before starting the production API.");
  }

  return {
    nodeEnv: parsed.NODE_ENV,
    host: parsed.HOST,
    port: parsed.PORT,
    corsOrigin: parsed.CORS_ORIGIN,
    jwtSecret: parsed.JWT_SECRET,
    jwtExpiresIn: parsed.JWT_EXPIRES_IN,
    allowAdminRegistration: parsed.ALLOW_ADMIN_REGISTRATION,
    logLevel: parsed.LOG_LEVEL,
    trustProxy: parsed.TRUST_PROXY,
  };
}
