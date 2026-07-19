import type { FastifyInstance, FastifyReply } from "fastify";

import { authenticate } from "../../../middleware/authenticate";
import { authorize } from "../../../middleware/authorize";
import { WritingController } from "../writing.controller";
import {
  createWritingTestSchema,
  updateWritingTestSchema,
} from "../writing.schemas";

const writingController = new WritingController();
const adminOnly = [authenticate, authorize("ADMIN")];

function validationFailed(reply: FastifyReply, errors: unknown) {
  return reply.status(400).send({
    success: false,
    message: "Validation failed",
    errors,
  });
}

/** Admin-only authoring and publication endpoints for Writing tests. */
export async function registerWritingAdminRoutes(fastify: FastifyInstance) {
  fastify.post("/admin/tests", { preHandler: adminOnly }, async (request, reply) => {
    const parsed = createWritingTestSchema.safeParse(request.body);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

    request.body = parsed.data;
    return writingController.createTest(request as never, reply);
  });

  fastify.get(
    "/admin/tests",
    { preHandler: adminOnly },
    writingController.getAllTests.bind(writingController)
  );

  fastify.get("/admin/tests/:id", { preHandler: adminOnly }, async (request, reply) =>
    writingController.getTestById(request as never, reply)
  );

  fastify.patch("/admin/tests/:id", { preHandler: adminOnly }, async (request, reply) => {
    const parsed = updateWritingTestSchema.safeParse(request.body);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

    request.body = parsed.data;
    return writingController.updateTest(request as never, reply);
  });

  fastify.delete("/admin/tests/:id", { preHandler: adminOnly }, async (request, reply) =>
    writingController.deleteTest(request as never, reply)
  );

  fastify.patch("/admin/tests/:id/publish", { preHandler: adminOnly }, async (request, reply) =>
    writingController.publishTest(request as never, reply)
  );

  fastify.patch("/admin/tests/:id/unpublish", { preHandler: adminOnly }, async (request, reply) =>
    writingController.unpublishTest(request as never, reply)
  );
}
