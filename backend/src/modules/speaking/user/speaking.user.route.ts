import type { FastifyInstance, FastifyReply } from "fastify";

import { authenticate } from "../../../middleware/authenticate";
import { authorize } from "../../../middleware/authorize";
import {
  publishedSpeakingTestsQuerySchema,
  saveSpeakingRecordingsSchema,
  submitSpeakingAttemptSchema,
} from "../speaking.schemas";
import { SpeakingUserController } from "./speaking.user.controller";

const speakingUserController = new SpeakingUserController();
const userOnly = [authenticate, authorize("USER")];

function validationFailed(reply: FastifyReply, errors: unknown) {
  return reply.status(400).send({
    success: false,
    message: "Validation failed",
    errors,
  });
}

export async function registerSpeakingUserRoutes(fastify: FastifyInstance) {
  fastify.get("/tests", async (request, reply) => {
    const parsed = publishedSpeakingTestsQuerySchema.safeParse(request.query);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

    request.query = parsed.data;
    return speakingUserController.getPublishedTests(request as any, reply);
  });

  fastify.get("/tests/:id", async (request, reply) =>
    speakingUserController.getPublishedTestById(request as any, reply)
  );

  fastify.post(
    "/tests/:id/attempts",
    { preHandler: userOnly },
    async (request, reply) => speakingUserController.startAttempt(request as any, reply)
  );

  fastify.get(
    "/attempts/:id",
    { preHandler: userOnly },
    async (request, reply) => speakingUserController.getAttempt(request as any, reply)
  );

  fastify.put(
    "/attempts/:id/recordings",
    { preHandler: userOnly },
    async (request, reply) => {
      const parsed = saveSpeakingRecordingsSchema.safeParse(request.body);
      if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

      request.body = parsed.data;
      return speakingUserController.saveRecordings(request as any, reply);
    }
  );

  fastify.post(
    "/attempts/:id/submit",
    { preHandler: userOnly },
    async (request, reply) => {
      const parsed = submitSpeakingAttemptSchema.safeParse(request.body ?? {});
      if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

      request.body = parsed.data;
      return speakingUserController.submitAttempt(request as any, reply);
    }
  );

  fastify.get(
    "/attempts/:id/result",
    { preHandler: userOnly },
    async (request, reply) => speakingUserController.getResult(request as any, reply)
  );
}
