import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  SaveSpeakingRecordingsInput,
  SpeakingCategory,
  SubmitSpeakingAttemptInput,
} from "../speaking.schemas";
import {
  SpeakingUserService,
  SpeakingUserServiceError,
} from "./speaking.user.service";

type IdParams = { id: string };
type AuthenticatedUser = { id: string; role: string };

function userId(request: FastifyRequest): string {
  return (request.user as AuthenticatedUser).id;
}

function sendError(reply: FastifyReply, error: unknown) {
  const statusCode = error instanceof SpeakingUserServiceError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error.";
  return reply.status(statusCode).send({ success: false, message });
}

export class SpeakingUserController {
  constructor(private readonly speakingService = new SpeakingUserService()) {}

  async getPublishedTests(
    request: FastifyRequest<{
      Querystring: { category?: SpeakingCategory; page: number; limit: number };
    }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        data: await this.speakingService.getPublishedTests(
          request.query.category,
          request.query.page,
          request.query.limit
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
        data: await this.speakingService.getPublishedTestById(request.params.id),
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
        data: await this.speakingService.startAttempt(userId(request), request.params.id),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async getAttempt(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        data: await this.speakingService.getAttempt(userId(request), request.params.id),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async saveRecordings(
    request: FastifyRequest<{ Params: IdParams; Body: SaveSpeakingRecordingsInput }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        data: await this.speakingService.saveRecordings(
          userId(request),
          request.params.id,
          request.body.recordings
        ),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async submitAttempt(
    request: FastifyRequest<{ Params: IdParams; Body: SubmitSpeakingAttemptInput }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.speakingService.submitAttempt(
        userId(request),
        request.params.id,
        request.body.recordings
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
        data: await this.speakingService.getResult(userId(request), request.params.id),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }
}
