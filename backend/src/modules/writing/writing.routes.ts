import { FastifyInstance } from "fastify";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { WritingController } from "./writing.controller";
import {
  createWritingTestSchema,
  updateWritingTestSchema,
} from "./writing.schemas";

const writingController = new WritingController();
const adminOnly = [authenticate, authorize("ADMIN")];

export async function registerWritingRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/admin/tests",
    { preHandler: adminOnly },
    async (request, reply) => {
      const result = createWritingTestSchema.safeParse(request.body);

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });
      }

      request.body = result.data;
      return writingController.createTest(request as never, reply);
    }
  );

  fastify.get(
    "/admin/tests",
    { preHandler: adminOnly },
    writingController.getAllTests.bind(writingController)
  );

  fastify.get(
    "/admin/tests/:id",
    { preHandler: adminOnly },
    async (request, reply) => writingController.getTestById(request as never, reply)
  );

  fastify.patch(
    "/admin/tests/:id",
    { preHandler: adminOnly },
    async (request, reply) => {
      const result = updateWritingTestSchema.safeParse(request.body);

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });
      }

      request.body = result.data;
      return writingController.updateTest(request as never, reply);
    }
  );

  fastify.delete(
    "/admin/tests/:id",
    { preHandler: adminOnly },
    async (request, reply) => writingController.deleteTest(request as never, reply)
  );

  fastify.patch(
    "/admin/tests/:id/publish",
    { preHandler: adminOnly },
    async (request, reply) => writingController.publishTest(request as never, reply)
  );

  fastify.patch(
    "/admin/tests/:id/unpublish",
    { preHandler: adminOnly },
    async (request, reply) => writingController.unpublishTest(request as never, reply)
  );

  fastify.get("/tests", writingController.getPublishedTests.bind(writingController));
  fastify.get("/tests/:id", writingController.getPublishedTestById.bind(writingController));
}
