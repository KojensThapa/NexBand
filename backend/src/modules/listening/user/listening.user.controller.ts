import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  SaveListeningAnswersInput,
  SubmitListeningAttemptInput,
} from "../listening.schemas";
import {
  ListeningUserService,
  ListeningUserServiceError,
} from "./listening.user.service";

type IdParams = { id: string };
type AudioParams = { id: string; partNumber: string };
type AuthenticatedUser = { id: string };

function getUserId(request: FastifyRequest): string {
  return (request.user as AuthenticatedUser).id;
}

function sendError(reply: FastifyReply, error: unknown) {
  const statusCode = error instanceof ListeningUserServiceError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error.";
  return reply.status(statusCode).send({ success: false, message });
}

export class ListeningUserController {
  constructor(private readonly listeningService = new ListeningUserService()) {}

  async getPublishedTests(
    request: FastifyRequest<{ Querystring: { page: number; limit: number } }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        data: await this.listeningService.getPublishedTests(request.query.page, request.query.limit),
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
        data: await this.listeningService.getPublishedTestById(request.params.id),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async streamAudio(
    request: FastifyRequest<{ Params: AudioParams }>,
    reply: FastifyReply
  ) {
    const partNumber = Number(request.params.partNumber);
    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 4) {
      return reply.status(400).send({ success: false, message: "Invalid listening part." });
    }

    try {
      const audioUrl = await this.listeningService.getAudioUrl(request.params.id, partNumber);
      return reply.redirect(audioUrl, 302);
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async startAttempt(request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
    try {
      return reply.status(201).send({
        success: true,
        data: await this.listeningService.startAttempt(getUserId(request), request.params.id),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async saveAnswers(
    request: FastifyRequest<{ Params: IdParams; Body: SaveListeningAnswersInput }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        data: await this.listeningService.saveAnswers(
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
    request: FastifyRequest<{ Params: IdParams; Body: SubmitListeningAttemptInput }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.listeningService.submitAttempt(
        getUserId(request),
        request.params.id,
        request.body.answers
      );
      return reply.status(data.alreadySubmitted ? 200 : 201).send({ success: true, data });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async getResult(request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
    try {
      return reply.send({
        success: true,
        data: await this.listeningService.getResult(getUserId(request), request.params.id),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }
}
