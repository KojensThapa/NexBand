import { FastifyInstance } from "fastify";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { ListeningController } from "./listening.controller";
import {
  createListeningMockTestSchema,
  updateListeningMockTestSchema,
} from "./listening.schemas";

const listeningController = new ListeningController();
const adminOnly = [authenticate, authorize("ADMIN")];

export async function registerListeningRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/mock-tests",
    { preHandler: adminOnly },
    async (request, reply) => {
      const result = createListeningMockTestSchema.safeParse(request.body);

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });
      }

      request.body = result.data;
      return listeningController.createMockTest(request as any, reply);
    }
  );

  fastify.get(
    "/mock-tests",
    { preHandler: adminOnly },
    listeningController.getAllMockTests.bind(listeningController)
  );

  fastify.get(
    "/mock-tests/:id",
    { preHandler: adminOnly },
    async (request, reply) =>
      listeningController.getMockTestById(request as any, reply)
  );

  fastify.patch(
    "/mock-tests/:id",
    { preHandler: adminOnly },
    async (request, reply) => {
      const result = updateListeningMockTestSchema.safeParse(request.body);

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });
      }

      request.body = result.data;
      return listeningController.updateMockTest(request as any, reply);
    }
  );

  fastify.delete(
    "/mock-tests/:id",
    { preHandler: adminOnly },
    async (request, reply) =>
      listeningController.deleteMockTest(request as any, reply)
  );

  fastify.patch(
    "/mock-tests/:id/publish",
    { preHandler: adminOnly },
    async (request, reply) =>
      listeningController.publishMockTest(request as any, reply)
  );

  fastify.patch(
    "/mock-tests/:id/unpublish",
    { preHandler: adminOnly },
    async (request, reply) =>
      listeningController.unpublishMockTest(request as any, reply)
  );

  fastify.get("/tests", listeningController.getPublishedTests.bind(listeningController));
  fastify.get("/tests/:id", listeningController.getPublishedTestById.bind(listeningController));
}
