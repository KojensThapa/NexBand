// import type { FastifyInstance } from "fastify";

// import type { AppConfig } from "../../config/env";
// import { AppError } from "../../core/errors/app-error";
// import { parseInput } from "../../core/http/validation";
// import type { AppRepositories } from "../../infrastructure/persistence/repositories";
// import { authenticate } from "../../plugins/auth";
// import { loginSchema, registrationSchema } from "./auth.schemas";
// import { AuthService } from "./auth.service";

// interface AuthRouteDependencies {
//   config: AppConfig;
//   repositories: AppRepositories;
// }

// function issueAccessToken(
//   app: FastifyInstance,
//   user: { id: string; email: string; role: "student" | "admin" },
//   expiresIn: string
// ) {
//   return app.jwt.sign(
//     { sub: user.id, email: user.email, role: user.role },
//     { expiresIn }
//   );
// }

// export async function registerAuthRoutes(
//   app: FastifyInstance,
//   dependencies: AuthRouteDependencies
// ): Promise<void> {
//   const authService = new AuthService(dependencies.repositories);

//   app.post("/register", async (request, reply) => {
//     const input = parseInput(registrationSchema, request.body);
//     const user = await authService.register(input, "student");
//     const accessToken = issueAccessToken(app, user, dependencies.config.jwtExpiresIn);

//     return reply.code(201).send({ data: { user, accessToken } });
//   });

//   app.post("/login", async (request) => {
//     const input = parseInput(loginSchema, request.body);
//     const user = await authService.login(input, "student");
//     const accessToken = issueAccessToken(app, user, dependencies.config.jwtExpiresIn);

//     return { data: { user, accessToken } };
//   });

//   app.post("/admin/register", async (request, reply) => {
//     if (!dependencies.config.allowAdminRegistration) {
//       throw AppError.forbidden("Admin registration is disabled.");
//     }

//     const input = parseInput(registrationSchema, request.body);
//     const user = await authService.register(input, "admin");
//     const accessToken = issueAccessToken(app, user, dependencies.config.jwtExpiresIn);

//     return reply.code(201).send({ data: { user, accessToken } });
//   });

//   app.post("/admin/login", async (request) => {
//     const input = parseInput(loginSchema, request.body);
//     const user = await authService.login(input, "admin");
//     const accessToken = issueAccessToken(app, user, dependencies.config.jwtExpiresIn);

//     return { data: { user, accessToken } };
//   });

//   app.get("/me", { preHandler: authenticate }, async (request) => {
//     const user = await authService.getUser(request.user.sub);
//     return { data: user };
//   });
// }

import { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller";
import { registerSchema, loginSchema, updateProfileSchema } from "./auth.schemas";
import { authenticate } from "./auth.middleware";
import { authorize } from "./role.middleware";

const authController = new AuthController();

export async function registerAuthRoutes(fastify: FastifyInstance) {
  // A role is selected by the endpoint, never by untrusted client input.
  fastify.post("/register", async (request, reply) => {
    const result = registerSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    return authController.register(request as any, reply, "USER");
  });

  fastify.post("/login", async (request, reply) => {
  const result = loginSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }
    return authController.login(request as any, reply, "USER");
  });

  fastify.post("/admin/register", async (request, reply) => {
    if (process.env.ALLOW_ADMIN_REGISTRATION === "false") {
      return reply.status(403).send({
        success: false,
        message: "Admin registration is disabled.",
      });
    }

    const result = registerSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    return authController.register(request as any, reply, "ADMIN");
  });

  fastify.post("/admin/login", async (request, reply) => {
    const result = loginSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    return authController.login(request as any, reply, "ADMIN");
  });

  fastify.get(
    "/me",
    {
      preHandler: authenticate,
    },
    authController.me.bind(authController)
  );

  fastify.patch("/me", { preHandler: authenticate }, async (request, reply) => {
    const result = updateProfileSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    request.body = result.data;
    return authController.updateProfile(request as any, reply);
  });

  fastify.delete("/me", { preHandler: authenticate }, authController.deleteAccount.bind(authController));

  fastify.get(
    "/admin-test",
    {
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async () => {
      return {
        success: true,
        message: "Welcome Admin 👑",
      };
    }
  );
}
