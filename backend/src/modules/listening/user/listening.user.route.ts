import type { FastifyInstance, FastifyReply } from "fastify";

import { authenticate } from "../../../middleware/authenticate";
import { authorize } from "../../../middleware/authorize";
import {
  publishedListeningTestsQuerySchema,
  saveListeningAnswersSchema,
  submitListeningAttemptSchema,
} from "../listening.schemas";
import { ListeningUserController } from "./listening.user.controller";

const listeningUserController = new ListeningUserController();
const userOnly = [authenticate, authorize("USER")];

function validationFailed(reply: FastifyReply, errors: unknown) {
  return reply.status(400).send({
    success: false,
    message: "Validation failed",
    errors,
  });
}

export async function registerListeningUserRoutes(fastify: FastifyInstance) {
  fastify.get("/tests", async (request, reply) => {
    const parsed = publishedListeningTestsQuerySchema.safeParse(request.query);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);
    request.query = parsed.data;
    return listeningUserController.getPublishedTests(request as never, reply);
  });

  fastify.get("/tests/:id", async (request, reply) =>
    listeningUserController.getPublishedTestById(request as never, reply)
  );

  fastify.get("/tests/:id/parts/:partNumber/audio", async (request, reply) =>
    listeningUserController.streamAudio(request as never, reply)
  );

  fastify.post("/tests/:id/attempts", { preHandler: userOnly }, async (request, reply) =>
    listeningUserController.startAttempt(request as never, reply)
  );

  fastify.put("/attempts/:id/answers", { preHandler: userOnly }, async (request, reply) => {
    const parsed = saveListeningAnswersSchema.safeParse(request.body);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);
    request.body = parsed.data;
    return listeningUserController.saveAnswers(request as never, reply);
  });

  fastify.post("/attempts/:id/submit", { preHandler: userOnly }, async (request, reply) => {
    const parsed = submitListeningAttemptSchema.safeParse(request.body ?? {});
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);
    request.body = parsed.data;
    return listeningUserController.submitAttempt(request as never, reply);
  });

  fastify.get("/attempts/:id/result", { preHandler: userOnly }, async (request, reply) =>
    listeningUserController.getResult(request as never, reply)
  );
}
