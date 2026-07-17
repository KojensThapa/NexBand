import { FastifyInstance } from "fastify";

import { ReadingController } from "./reading.controller";
import { createReadingMockTestSchema, updateReadingMockTestSchema } from "./reading.schemas";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const readingController = new ReadingController();

export async function registerReadingRoutes(fastify: FastifyInstance) {

  // ==========================
  // Create Reading Mock Test
  // Admin Only
  // ==========================
  fastify.post(
    "/mock-tests",
    {
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
      const result = createReadingMockTestSchema.safeParse(request.body);

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });
      }

      return readingController.createMockTest(request as any, reply);
    }
  );

  // ==========================
  // Get All Reading Mock Tests
  // ==========================
  fastify.get(
    "/mock-tests",
    readingController.getAllMockTests.bind(readingController)
  );

  // ==========================
  // Get Reading Mock Test By Id
  // ==========================
  fastify.get(
    "/mock-tests/:id",
    readingController.getMockTestById.bind(readingController)
  );

  // ==========================
  // Delete Reading Mock Test
  // Admin Only
  // ==========================
  fastify.delete(
    "/mock-tests/:id",
    {
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
        return readingController.deleteMockTest(request as any, reply);
    }
  );

  // ==========================
  // Publish Reading Mock Test
  // Admin Only
  // ==========================
  fastify.patch(
    "/mock-tests/:id/publish",
    {
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
        return readingController.publishMockTest(request as any, reply);
    }
  );

  // ==========================
  // Unpublish Reading Mock Test
  // Admin Only
  // ==========================
  fastify.patch(
    "/mock-tests/:id/unpublish",
    {
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
        return readingController.unpublishMockTest(request as any, reply);
    }
  );

  // ==========================
  // Update Reading Mock Test
  // Admin Only
  // ==========================
  fastify.patch(
  "/mock-tests/:id",
  {
    preHandler: [
      authenticate,
      authorize("ADMIN"),
    ],
  },
  async (request, reply) => {
    const result =
      updateReadingMockTestSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        success: false,
        errors: result.error.flatten().fieldErrors,
      });
    }

    return readingController.updateMockTest(
      request as any,
      reply
    );
  }
);

  fastify.get(
    "/tests",
    readingController.getPublishedTests.bind(readingController)
  );

  fastify.get(
    "/tests/:id",
    readingController.getPublishedTestById.bind(readingController)
  );
}