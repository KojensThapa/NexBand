import type { FastifyReply, FastifyRequest } from "fastify";

import type { CreateSpeakingSubmissionInput } from "../speaking.schemas";
import { SpeakingService, SpeakingServiceError } from "../services/speaking.service";

type AuthenticatedUser = { id: string; role: string };
type IdParams = { id: string };

function userId(request: FastifyRequest): string {
  return (request.user as AuthenticatedUser).id;
}

function sendError(reply: FastifyReply, error: unknown) {
  const statusCode = error instanceof SpeakingServiceError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error.";
  return reply.status(statusCode).send({ success: false, message });
}

export class SpeakingController {
  constructor(private readonly speakingService = new SpeakingService()) {}

  async createSubmission(
    request: FastifyRequest<{ Body: CreateSpeakingSubmissionInput }>,
    reply: FastifyReply
  ) {
    try {
      return reply.status(201).send({ success: true, data: await this.speakingService.submit(userId(request), request.body) });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async getSubmission(request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
    try {
      return reply.send({ success: true, data: await this.speakingService.getSubmission(userId(request), request.params.id) });
    } catch (error) {
      return sendError(reply, error);
    }
  }
}

