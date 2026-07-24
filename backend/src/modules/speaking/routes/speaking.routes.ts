import type { FastifyInstance, FastifyReply } from "fastify";

import { authenticate } from "../../../middleware/authenticate";
import { authorize } from "../../../middleware/authorize";
import {
  createSpeakingSubmissionSchema,
  speakingSubmissionParamsSchema,
} from "../speaking.schemas";
import { SpeakingController } from "../controller/speaking.controller";

const speakingController = new SpeakingController();
const userOnly = [authenticate, authorize("USER")];

function validationFailed(reply: FastifyReply, errors: unknown) {
  return reply.status(400).send({ success: false, message: "Validation failed", errors });
}

export async function registerSpeakingEvaluationRoutes(fastify: FastifyInstance) {
  fastify.post("/submissions", { preHandler: userOnly }, async (request, reply) => {
    const parsed = createSpeakingSubmissionSchema.safeParse(request.body);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);
    request.body = parsed.data;
    return speakingController.createSubmission(request as never, reply);
  });

  fastify.get("/submissions/:id", { preHandler: userOnly }, async (request, reply) => {
    const parsed = speakingSubmissionParamsSchema.safeParse(request.params);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);
    request.params = parsed.data;
    return speakingController.getSubmission(request as never, reply);
  });
}

