import type { FastifyInstance, FastifyReply } from "fastify";

import { authenticate } from "../../../middleware/authenticate";
import { authorize } from "../../../middleware/authorize";
import {
  createSpeakingTestSchema,
  updateSpeakingTestSchema,
} from "../speaking.schemas";
import { SpeakingAdminController } from "./speaking.admin.controller";

const speakingAdminController = new SpeakingAdminController();
const adminOnly = [authenticate, authorize("ADMIN")];

function validationFailed(reply: FastifyReply, errors: unknown) {
  return reply.status(400).send({
    success: false,
    message: "Validation failed",
    errors,
  });
}

export async function registerSpeakingAdminRoutes(fastify: FastifyInstance) {
  fastify.post("/mock-tests", { preHandler: adminOnly }, async (request, reply) => {
    const parsed = createSpeakingTestSchema.safeParse(request.body);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

    request.body = parsed.data;
    return speakingAdminController.createTest(request as any, reply);
  });

  fastify.get(
    "/mock-tests",
    { preHandler: adminOnly },
    speakingAdminController.getAllTests.bind(speakingAdminController)
  );

  fastify.get(
    "/mock-tests/:id",
    { preHandler: adminOnly },
    async (request, reply) => speakingAdminController.getTestById(request as any, reply)
  );

  fastify.patch("/mock-tests/:id", { preHandler: adminOnly }, async (request, reply) => {
    const parsed = updateSpeakingTestSchema.safeParse(request.body);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

    request.body = parsed.data;
    return speakingAdminController.updateTest(request as any, reply);
  });

  fastify.delete(
    "/mock-tests/:id",
    { preHandler: adminOnly },
    async (request, reply) => speakingAdminController.deleteTest(request as any, reply)
  );

  fastify.patch(
    "/mock-tests/:id/publish",
    { preHandler: adminOnly },
    async (request, reply) => speakingAdminController.publishTest(request as any, reply)
  );

  fastify.patch(
    "/mock-tests/:id/unpublish",
    { preHandler: adminOnly },
    async (request, reply) => speakingAdminController.unpublishTest(request as any, reply)
  );
}
