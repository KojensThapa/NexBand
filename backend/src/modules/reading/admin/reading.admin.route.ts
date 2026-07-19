import type { FastifyInstance, FastifyReply } from "fastify";

import { authenticate } from "../../../middleware/authenticate";
import { authorize } from "../../../middleware/authorize";
import {
  createReadingMockTestSchema,
  updateReadingMockTestSchema,
} from "../reading.schemas";
import { ReadingAdminController } from "./reading.admin.controller";

const readingAdminController = new ReadingAdminController();
const adminOnly = [authenticate, authorize("ADMIN")];

function validationFailed(reply: FastifyReply, errors: unknown) {
  return reply.status(400).send({
    success: false,
    message: "Validation failed",
    errors,
  });
}

export async function registerReadingAdminRoutes(fastify: FastifyInstance) {
  fastify.post("/mock-tests", { preHandler: adminOnly }, async (request, reply) => {
    const parsed = createReadingMockTestSchema.safeParse(request.body);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

    request.body = parsed.data;
    return readingAdminController.createMockTest(request as any, reply);
  });

  fastify.get(
    "/mock-tests",
    { preHandler: adminOnly },
    readingAdminController.getAllMockTests.bind(readingAdminController)
  );

  fastify.get(
    "/mock-tests/:id",
    { preHandler: adminOnly },
    async (request, reply) => readingAdminController.getMockTestById(request as any, reply)
  );

  fastify.patch("/mock-tests/:id", { preHandler: adminOnly }, async (request, reply) => {
    const parsed = updateReadingMockTestSchema.safeParse(request.body);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

    request.body = parsed.data;
    return readingAdminController.updateMockTest(request as any, reply);
  });

  fastify.delete(
    "/mock-tests/:id",
    { preHandler: adminOnly },
    async (request, reply) => readingAdminController.deleteMockTest(request as any, reply)
  );

  fastify.patch(
    "/mock-tests/:id/publish",
    { preHandler: adminOnly },
    async (request, reply) => readingAdminController.publishMockTest(request as any, reply)
  );

  fastify.patch(
    "/mock-tests/:id/unpublish",
    { preHandler: adminOnly },
    async (request, reply) => readingAdminController.unpublishMockTest(request as any, reply)
  );
}
