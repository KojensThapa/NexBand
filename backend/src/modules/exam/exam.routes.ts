// import type { FastifyInstance } from "fastify";

// import { parseInput } from "../../core/http/validation";
// import type { AppRepositories } from "../../infrastructure/persistence/repositories";
// import { requireRole } from "../../plugins/auth";
// import {
//   createExamSchema,
//   examIdSchema,
//   examListQuerySchema,
//   publishExamSchema,
//   updateExamSchema,
// } from "./exam.schemas";
// import { ExamService } from "./exam.service";

// export async function registerExamRoutes(
//   app: FastifyInstance,
//   repositories: AppRepositories
// ): Promise<void> {
//   const examService = new ExamService(repositories);
//   const requireAdmin = requireRole("admin");

//   app.get("/tests", async (request) => {
//     const query = parseInput(examListQuerySchema, request.query);
//     const tests = await examService.listPublished(query.skill);
//     return { data: tests };
//   });

//   app.get("/tests/:id", async (request) => {
//     const { id } = parseInput(examIdSchema, request.params);
//     const test = await examService.getPublished(id);
//     return { data: test };
//   });

//   app.get("/admin/tests", { preHandler: requireAdmin }, async (request) => {
//     const query = parseInput(examListQuerySchema, request.query);
//     const tests = await examService.listForAdmin(query.skill);
//     return { data: tests };
//   });

//   app.post("/admin/tests", { preHandler: requireAdmin }, async (request, reply) => {
//     const input = parseInput(createExamSchema, request.body);
//     const test = await examService.create(input, request.user.sub);
//     return reply.code(201).send({ data: test });
//   });

//   app.patch("/admin/tests/:id", { preHandler: requireAdmin }, async (request) => {
//     const { id } = parseInput(examIdSchema, request.params);
//     const input = parseInput(updateExamSchema, request.body);
//     const test = await examService.update(id, input);
//     return { data: test };
//   });

//   app.patch("/admin/tests/:id/publish", { preHandler: requireAdmin }, async (request) => {
//     const { id } = parseInput(examIdSchema, request.params);
//     const { published } = parseInput(publishExamSchema, request.body);
//     const test = await examService.setPublished(id, published);
//     return { data: test };
//   });

//   app.delete("/admin/tests/:id", { preHandler: requireAdmin }, async (request, reply) => {
//     const { id } = parseInput(examIdSchema, request.params);
//     await examService.delete(id);
//     return reply.code(204).send();
//   });
// }
