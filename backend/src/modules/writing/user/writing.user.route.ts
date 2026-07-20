import type { FastifyInstance, FastifyReply } from "fastify";

import { authenticate } from "../../../middleware/authenticate";
import { authorize } from "../../../middleware/authorize";
import {
  publishedWritingTestsQuerySchema,
  saveWritingDraftSchema,
  submitWritingAttemptSchema,
} from "../writing.schemas";
import { WritingUserController } from "./writing.user.controller";

const writingUserController = new WritingUserController();
const userOnly = [authenticate, authorize("USER")];

function validationFailed(reply: FastifyReply, errors: unknown) {
  return reply.status(400).send({
    success: false,
    message: "Validation failed",
    errors,
  });
}

/** Learner Writing API: published questions, drafts, and pending-analysis submissions. */
export async function registerWritingUserRoutes(fastify: FastifyInstance) {
  fastify.get("/tests", async (request, reply) => {
    const parsed = publishedWritingTestsQuerySchema.safeParse(request.query);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

    request.query = parsed.data;
    return writingUserController.getPublishedTests(request as never, reply);
  });

  fastify.get("/tests/:id", async (request, reply) =>
    writingUserController.getPublishedTestById(request as never, reply)
  );

  fastify.post("/tests/:id/attempts", { preHandler: userOnly }, async (request, reply) =>
    writingUserController.startAttempt(request as never, reply)
  );

  fastify.put("/attempts/:id/draft", { preHandler: userOnly }, async (request, reply) => {
    const parsed = saveWritingDraftSchema.safeParse(request.body);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

    request.body = parsed.data;
    return writingUserController.saveDraft(request as never, reply);
  });

  fastify.post("/attempts/:id/submit", { preHandler: userOnly }, async (request, reply) => {
    const parsed = submitWritingAttemptSchema.safeParse(request.body ?? {});
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

    request.body = parsed.data;
    return writingUserController.submitEssay(request as never, reply);
  });
}
