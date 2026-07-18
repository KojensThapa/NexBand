import { FastifyInstance } from "fastify";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { SpeakingController } from "./speaking.controller";
import {
  createSpeakingMockTestSchema,
  updateSpeakingMockTestSchema,
} from "./speaking.schemas";

const speakingController = new SpeakingController();
const adminOnly = [authenticate, authorize("ADMIN")];

function sendValidationError(reply: { status: (code: number) => { send: (body: unknown) => unknown } }, errors: unknown) {
  return reply.status(400).send({
    success: false,
    message: "Validation failed",
    errors,
  });
}

export async function registerSpeakingRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/mock-tests",
    { preHandler: adminOnly },
    async (request, reply) => {
      const result = createSpeakingMockTestSchema.safeParse(request.body);

      if (!result.success) {
        return sendValidationError(reply, result.error.flatten().fieldErrors);
      }

      request.body = result.data;
      return speakingController.createMockTest(request as never, reply);
    }
  );

  fastify.get(
    "/mock-tests",
    { preHandler: adminOnly },
    speakingController.getAllMockTests.bind(speakingController)
  );

  fastify.get(
    "/mock-tests/:id",
    { preHandler: adminOnly },
    async (request, reply) =>
      speakingController.getMockTestById(request as never, reply)
  );

  fastify.patch(
    "/mock-tests/:id",
    { preHandler: adminOnly },
    async (request, reply) => {
      const result = updateSpeakingMockTestSchema.safeParse(request.body);

      if (!result.success) {
        return sendValidationError(reply, result.error.flatten().fieldErrors);
      }

      request.body = result.data;
      return speakingController.updateMockTest(request as never, reply);
    }
  );

  fastify.delete(
    "/mock-tests/:id",
    { preHandler: adminOnly },
    async (request, reply) =>
      speakingController.deleteMockTest(request as never, reply)
  );

  fastify.patch(
    "/mock-tests/:id/publish",
    { preHandler: adminOnly },
    async (request, reply) =>
      speakingController.publishMockTest(request as never, reply)
  );

  fastify.patch(
    "/mock-tests/:id/unpublish",
    { preHandler: adminOnly },
    async (request, reply) =>
      speakingController.unpublishMockTest(request as never, reply)
  );

  fastify.get("/tests", speakingController.getPublishedTests.bind(speakingController));
  fastify.get("/tests/:id", speakingController.getPublishedTestById.bind(speakingController));
}
