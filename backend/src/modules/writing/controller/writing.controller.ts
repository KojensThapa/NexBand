import type { FastifyReply, FastifyRequest } from "fastify";

import { WritingEvaluationService, WritingServiceError } from "../services/writing.service";
import type { CreateWritingSubmissionInput } from "../writing.schemas";

type AuthenticatedUser = { id: string };
type IdParams = { id: string };

function currentUserId(request: FastifyRequest): string {
  return (request.user as AuthenticatedUser).id;
}

function sendError(reply: FastifyReply, error: unknown) {
  const statusCode = error instanceof WritingServiceError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error.";
  return reply.status(statusCode).send({ success: false, message });
}

export class WritingEvaluationController {
  constructor(private readonly writingService = new WritingEvaluationService()) {}

  async createSubmission(
    request: FastifyRequest<{ Body: CreateWritingSubmissionInput }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.writingService.submit(currentUserId(request), request.body);
      return reply.status(201).send({ success: true, data });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async getSubmission(request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
    try {
      return reply.send({ success: true, data: await this.writingService.getSubmission(currentUserId(request), request.params.id) });
    } catch (error) {
      return sendError(reply, error);
    }
  }
}

