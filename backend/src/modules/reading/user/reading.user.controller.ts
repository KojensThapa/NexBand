import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  SaveReadingAnswersInput,
  SubmitReadingAttemptInput,
} from "../reading.schemas";
import {
  ReadingUserService,
  ReadingUserServiceError,
} from "./reading.user.service";

type IdParams = { id: string };
type AuthenticatedUser = { id: string; role: string };

function getUserId(request: FastifyRequest): string {
  return (request.user as AuthenticatedUser).id;
}

function sendError(reply: FastifyReply, error: unknown) {
  const statusCode = error instanceof ReadingUserServiceError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error.";
  return reply.status(statusCode).send({ success: false, message });
}

export class ReadingUserController {
  constructor(private readonly readingService = new ReadingUserService()) {}

  async getPublishedTests(
    request: FastifyRequest<{ Querystring: { page: number; limit: number } }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.readingService.getPublishedTests(
        request.query.page,
        request.query.limit
      );
      return reply.send({ success: true, data });
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
        data: await this.readingService.getPublishedTestById(request.params.id),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async startAttempt(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    try {
      return reply.status(201).send({
        success: true,
        data: await this.readingService.startAttempt(getUserId(request), request.params.id),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async saveAnswers(
    request: FastifyRequest<{ Params: IdParams; Body: SaveReadingAnswersInput }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        data: await this.readingService.saveAnswers(
          getUserId(request),
          request.params.id,
          request.body.answers
        ),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async submitAttempt(
    request: FastifyRequest<{ Params: IdParams; Body: SubmitReadingAttemptInput }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.readingService.submitAttempt(
        getUserId(request),
        request.params.id,
        request.body.answers
      );
      return reply.status(data.alreadySubmitted ? 200 : 201).send({ success: true, data });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async getResult(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        data: await this.readingService.getResult(getUserId(request), request.params.id),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }
}
