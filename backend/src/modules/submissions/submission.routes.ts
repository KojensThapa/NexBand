// import type { FastifyInstance } from "fastify";

// import { parseInput } from "../../core/http/validation";
// import type { AppRepositories } from "../../infrastructure/persistence/repositories";
// import { authenticate } from "../../plugins/auth";
// import { submissionIdSchema, submitExamSchema } from "./submission.schemas";
// import { SubmissionService } from "./submission.service";

// export async function registerSubmissionRoutes(
//   app: FastifyInstance,
//   repositories: AppRepositories
// ): Promise<void> {
//   const submissionService = new SubmissionService(repositories);

//   app.post("/submissions", { preHandler: authenticate }, async (request, reply) => {
//     const input = parseInput(submitExamSchema, request.body);
//     const submission = await submissionService.submit(request.user.sub, input);
//     return reply.code(202).send({ data: submission });
//   });

//   app.get("/submissions", { preHandler: authenticate }, async (request) => {
//     const submissions = await submissionService.listForUser(request.user.sub);
//     return { data: submissions };
//   });

//   app.get("/submissions/:id", { preHandler: authenticate }, async (request) => {
//     const { id } = parseInput(submissionIdSchema, request.params);
//     const submission = await submissionService.getForUser(id, request.user.sub);
//     return { data: submission };
//   });
// }
