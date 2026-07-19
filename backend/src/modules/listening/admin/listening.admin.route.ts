import type { FastifyInstance, FastifyReply } from "fastify";

import { authenticate } from "../../../middleware/authenticate";
import { authorize } from "../../../middleware/authorize";
import {
  createListeningMockTestSchema,
  updateListeningMockTestSchema,
} from "../listening.schemas";
import { ListeningAdminController } from "./listening.admin.controller";

const listeningAdminController = new ListeningAdminController();
const adminOnly = [authenticate, authorize("ADMIN")];

function validationFailed(reply: FastifyReply, errors: unknown) {
  return reply.status(400).send({
    success: false,
    message: "Validation failed",
    errors,
  });
}

export async function registerListeningAdminRoutes(fastify: FastifyInstance) {
  fastify.post("/mock-tests", { preHandler: adminOnly }, async (request, reply) => {
    const parsed = createListeningMockTestSchema.safeParse(request.body);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

    request.body = parsed.data;
    return listeningAdminController.createMockTest(request as never, reply);
  });

  fastify.get(
    "/mock-tests",
    { preHandler: adminOnly },
    listeningAdminController.getAllMockTests.bind(listeningAdminController)
  );

  fastify.get("/mock-tests/:id", { preHandler: adminOnly }, async (request, reply) =>
    listeningAdminController.getMockTestById(request as never, reply)
  );

  fastify.patch("/mock-tests/:id", { preHandler: adminOnly }, async (request, reply) => {
    const parsed = updateListeningMockTestSchema.safeParse(request.body);
    if (!parsed.success) return validationFailed(reply, parsed.error.flatten().fieldErrors);

    request.body = parsed.data;
    return listeningAdminController.updateMockTest(request as never, reply);
  });

  fastify.delete("/mock-tests/:id", { preHandler: adminOnly }, async (request, reply) =>
    listeningAdminController.deleteMockTest(request as never, reply)
  );

  fastify.patch("/mock-tests/:id/publish", { preHandler: adminOnly }, async (request, reply) =>
    listeningAdminController.publishMockTest(request as never, reply)
  );

  fastify.patch("/mock-tests/:id/unpublish", { preHandler: adminOnly }, async (request, reply) =>
    listeningAdminController.unpublishMockTest(request as never, reply)
  );
}
