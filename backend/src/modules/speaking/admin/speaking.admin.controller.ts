import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  CreateSpeakingTestInput,
  UpdateSpeakingTestInput,
} from "../speaking.schemas";
import {
  SpeakingAdminService,
  SpeakingAdminServiceError,
} from "./speaking.admin.service";

type IdParams = { id: string };

function sendError(reply: FastifyReply, error: unknown) {
  const statusCode = error instanceof SpeakingAdminServiceError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error.";
  return reply.status(statusCode).send({ success: false, message });
}

export class SpeakingAdminController {
  constructor(private readonly speakingService = new SpeakingAdminService()) {}

  async createTest(
    request: FastifyRequest<{ Body: CreateSpeakingTestInput }>,
    reply: FastifyReply
  ) {
    try {
      return reply.status(201).send({
        success: true,
        message: "Speaking test created successfully.",
        data: await this.speakingService.createTest(request.body),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async getAllTests(_request: FastifyRequest, reply: FastifyReply) {
    try {
      return reply.send({ success: true, data: await this.speakingService.getAllTests() });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async getTestById(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({ success: true, data: await this.speakingService.getTestById(request.params.id) });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async updateTest(
    request: FastifyRequest<{ Params: IdParams; Body: UpdateSpeakingTestInput }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        message: "Speaking test updated successfully.",
        data: await this.speakingService.updateTest(request.params.id, request.body),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async deleteTest(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    try {
      await this.speakingService.deleteTest(request.params.id);
      return reply.send({ success: true, message: "Speaking test deleted successfully." });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async publishTest(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        message: "Speaking test published successfully.",
        data: await this.speakingService.setPublished(request.params.id, true),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async unpublishTest(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        message: "Speaking test unpublished successfully.",
        data: await this.speakingService.setPublished(request.params.id, false),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }
}
