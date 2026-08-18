import { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  registerInitiateSchema,
  registerVerifySchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schemas";
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

  // Email OTP verification: no account exists until /register/verify succeeds.
  fastify.post("/register/initiate", async (request, reply) => {
    const result = registerInitiateSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    request.body = result.data;
    return authController.registerInitiate(request as any, reply, "USER");
  });

  fastify.post("/register/verify", async (request, reply) => {
    const result = registerVerifySchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    request.body = result.data;
    return authController.registerVerify(request as any, reply, "USER");
  });

  fastify.post(
    "/resend-otp",
    { config: { rateLimit: { max: 5, timeWindow: "5 minutes" } } },
    async (request, reply) => {
      const result = resendOtpSchema.safeParse(request.body);

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });
      }

      request.body = result.data;
      return authController.resendOtp(request as any, reply, "USER");
    }
  );

  fastify.post(
    "/forgot-password",
    { config: { rateLimit: { max: 5, timeWindow: "5 minutes" } } },
    async (request, reply) => {
      const result = forgotPasswordSchema.safeParse(request.body);

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });
      }

      request.body = result.data;
      return authController.forgotPassword(request as any, reply, "USER");
    }
  );

  fastify.post("/reset-password", async (request, reply) => {
    const result = resetPasswordSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    request.body = result.data;
    return authController.resetPassword(request as any, reply);
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

  // Admin registration reuses the same OTP email-verification flow as user
  // registration: no Admin row exists until /admin/register/verify succeeds.
  fastify.post("/admin/register/initiate", async (request, reply) => {
    if (process.env.ALLOW_ADMIN_REGISTRATION === "false") {
      return reply.status(403).send({
        success: false,
        message: "Admin registration is disabled.",
      });
    }

    const result = registerInitiateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    request.body = result.data;
    return authController.registerInitiate(request as any, reply, "ADMIN");
  });

  fastify.post("/admin/register/verify", async (request, reply) => {
    const result = registerVerifySchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    request.body = result.data;
    return authController.registerVerify(request as any, reply, "ADMIN");
  });

  fastify.post(
    "/admin/resend-otp",
    { config: { rateLimit: { max: 5, timeWindow: "5 minutes" } } },
    async (request, reply) => {
      const result = resendOtpSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });
      }

      request.body = result.data;
      return authController.resendOtp(request as any, reply, "ADMIN");
    }
  );

  fastify.post(
    "/admin/forgot-password",
    { config: { rateLimit: { max: 5, timeWindow: "5 minutes" } } },
    async (request, reply) => {
      const result = forgotPasswordSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });
      }

      request.body = result.data;
      return authController.forgotPassword(request as any, reply, "ADMIN");
    }
  );

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
