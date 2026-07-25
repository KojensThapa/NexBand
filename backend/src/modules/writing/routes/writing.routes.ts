import type { FastifyInstance, FastifyReply } from "fastify";

import { authenticate } from "../../../middleware/authenticate";
import { authorize } from "../../../middleware/authorize";
import { WritingEvaluationController } from "../controller/writing.controller";
import {
  createWritingSubmissionSchema,
  writingSubmissionParamsSchema,
} from "../writing.schemas";

const controller = new WritingEvaluationController();
const userOnly = [authenticate, authorize("USER")];

function validationFailed(reply: FastifyReply, errors: unknown) {
  return reply.status(400).send({ success: false, message: "Validation failed", errors });
}

export async function registerWritingEvaluationRoutes(fastify: FastifyInstance) {
  fastify.post("/submissions", { preHandler: userOnly }, async (request, reply) => {
    const parsed = createWritingSubmissionSchema.safeParse(request.body);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);
    request.body = parsed.data;
    return controller.createSubmission(request as never, reply);
  });

  fastify.get("/submissions/:id", { preHandler: userOnly }, async (request, reply) => {
    const parsed = writingSubmissionParamsSchema.safeParse(request.params);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);
    request.params = parsed.data;
    return controller.getSubmission(request as never, reply);
  });
}

