import type { FastifyInstance, FastifyReply } from "fastify";

import { authenticate } from "../../../middleware/authenticate";
import { authorize } from "../../../middleware/authorize";
import {
  publishedReadingTestsQuerySchema,
  saveReadingAnswersSchema,
  submitReadingAttemptSchema,
} from "../reading.schemas";
import { ReadingUserController } from "./reading.user.controller";

const readingUserController = new ReadingUserController();
const userOnly = [authenticate, authorize("USER")];

function validationFailed(reply: FastifyReply, errors: unknown) {
  return reply.status(400).send({
    success: false,
    message: "Validation failed",
    errors,
  });
}

export async function registerReadingUserRoutes(fastify: FastifyInstance) {
  fastify.get("/tests", async (request, reply) => {
    const parsed = publishedReadingTestsQuerySchema.safeParse(request.query);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

    request.query = parsed.data;
    return readingUserController.getPublishedTests(request as any, reply);
  });

  fastify.get("/tests/:id", async (request, reply) =>
    readingUserController.getPublishedTestById(request as any, reply)
  );

  fastify.post(
    "/tests/:id/attempts",
    { preHandler: userOnly },
    async (request, reply) => readingUserController.startAttempt(request as any, reply)
  );

  fastify.put(
    "/attempts/:id/answers",
    { preHandler: userOnly },
    async (request, reply) => {
      const parsed = saveReadingAnswersSchema.safeParse(request.body);
      if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

      request.body = parsed.data;
      return readingUserController.saveAnswers(request as any, reply);
    }
  );

  fastify.post(
    "/attempts/:id/submit",
    { preHandler: userOnly },
    async (request, reply) => {
      const parsed = submitReadingAttemptSchema.safeParse(request.body ?? {});
      if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

      request.body = parsed.data;
      return readingUserController.submitAttempt(request as any, reply);
    }
  );

  fastify.get(
    "/attempts/:id/result",
    { preHandler: userOnly },
    async (request, reply) => readingUserController.getResult(request as any, reply)
  );
}
