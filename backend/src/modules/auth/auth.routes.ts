import type { FastifyInstance } from "fastify";

import type { AppConfig } from "../../config/env";
import { AppError } from "../../core/errors/app-error";
import { parseInput } from "../../core/http/validation";
import type { AppRepositories } from "../../infrastructure/persistence/repositories";
import { authenticate } from "../../plugins/auth";
import { loginSchema, registrationSchema } from "./auth.schemas";
import { AuthService } from "./auth.service";

interface AuthRouteDependencies {
  config: AppConfig;
  repositories: AppRepositories;
}

function issueAccessToken(
  app: FastifyInstance,
  user: { id: string; email: string; role: "student" | "admin" },
  expiresIn: string
) {
  return app.jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    { expiresIn }
  );
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  dependencies: AuthRouteDependencies
): Promise<void> {
  const authService = new AuthService(dependencies.repositories);

  app.post("/register", async (request, reply) => {
    const input = parseInput(registrationSchema, request.body);
    const user = await authService.register(input, "student");
    const accessToken = issueAccessToken(app, user, dependencies.config.jwtExpiresIn);

    return reply.code(201).send({ data: { user, accessToken } });
  });

  app.post("/login", async (request) => {
    const input = parseInput(loginSchema, request.body);
    const user = await authService.login(input, "student");
    const accessToken = issueAccessToken(app, user, dependencies.config.jwtExpiresIn);

    return { data: { user, accessToken } };
  });

  app.post("/admin/register", async (request, reply) => {
    if (!dependencies.config.allowAdminRegistration) {
      throw AppError.forbidden("Admin registration is disabled.");
    }

    const input = parseInput(registrationSchema, request.body);
    const user = await authService.register(input, "admin");
    const accessToken = issueAccessToken(app, user, dependencies.config.jwtExpiresIn);

    return reply.code(201).send({ data: { user, accessToken } });
  });

  app.post("/admin/login", async (request) => {
    const input = parseInput(loginSchema, request.body);
    const user = await authService.login(input, "admin");
    const accessToken = issueAccessToken(app, user, dependencies.config.jwtExpiresIn);

    return { data: { user, accessToken } };
  });

  app.get("/me", { preHandler: authenticate }, async (request) => {
    const user = await authService.getUser(request.user.sub);
    return { data: user };
  });
}
