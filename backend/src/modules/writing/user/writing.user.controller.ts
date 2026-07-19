import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  SaveWritingDraftInput,
  SubmitWritingAttemptInput,
  WritingCategoryInput,
} from "../writing.schemas";
import {
  WritingUserService,
  WritingUserServiceError,
} from "./writing.user.service";

type IdParams = { id: string };
type AuthenticatedUser = { id: string };

function getUserId(request: FastifyRequest): string {
  return (request.user as AuthenticatedUser).id;
}

function sendError(reply: FastifyReply, error: unknown) {
  const statusCode = error instanceof WritingUserServiceError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error.";
  return reply.status(statusCode).send({ success: false, message });
}

export class WritingUserController {
  constructor(private readonly writingService = new WritingUserService()) {}

  async getPublishedTests(
    request: FastifyRequest<{
      Querystring: { page: number; limit: number; category?: WritingCategoryInput };
    }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        data: await this.writingService.getPublishedTests(
          request.query.page,
          request.query.limit,
          request.query.category
        ),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async getPublishedTestById(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        data: await this.writingService.getPublishedTestById(request.params.id),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async startAttempt(request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
    try {
      return reply.status(201).send({
        success: true,
        data: await this.writingService.startAttempt(getUserId(request), request.params.id),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async saveDraft(
    request: FastifyRequest<{ Params: IdParams; Body: SaveWritingDraftInput }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        data: await this.writingService.saveDraft(
          getUserId(request),
          request.params.id,
          request.body.essays
        ),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async submitEssay(
    request: FastifyRequest<{ Params: IdParams; Body: SubmitWritingAttemptInput }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.writingService.submitEssay(
        getUserId(request),
        request.params.id,
        request.body.essays ?? []
      );
      return reply.status(data.alreadySubmitted ? 200 : 201).send({ success: true, data });
    } catch (error) {
      return sendError(reply, error);
    }
  }
}
