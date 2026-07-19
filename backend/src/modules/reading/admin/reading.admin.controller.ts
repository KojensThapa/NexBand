import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  CreateReadingMockTestInput,
  UpdateReadingMockTestInput,
} from "../reading.schemas";
import {
  ReadingAdminService,
  ReadingAdminServiceError,
} from "./reading.admin.service";

type IdParams = { id: string };

function sendError(reply: FastifyReply, error: unknown) {
  const statusCode = error instanceof ReadingAdminServiceError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error.";
  return reply.status(statusCode).send({ success: false, message });
}

export class ReadingAdminController {
  constructor(private readonly readingService = new ReadingAdminService()) {}

  async createMockTest(
    request: FastifyRequest<{ Body: CreateReadingMockTestInput }>,
    reply: FastifyReply
  ) {
    try {
      const mockTest = await this.readingService.createMockTest(request.body);
      return reply.status(201).send({
        success: true,
        message: "Reading mock test created successfully.",
        data: mockTest,
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async getAllMockTests(_request: FastifyRequest, reply: FastifyReply) {
    try {
      return reply.send({ success: true, data: await this.readingService.getAllMockTests() });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async getMockTestById(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        data: await this.readingService.getMockTestById(request.params.id),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async updateMockTest(
    request: FastifyRequest<{ Params: IdParams; Body: UpdateReadingMockTestInput }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        message: "Reading mock test updated successfully.",
        data: await this.readingService.updateMockTest(request.params.id, request.body),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async deleteMockTest(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    try {
      await this.readingService.deleteMockTest(request.params.id);
      return reply.send({ success: true, message: "Reading mock test deleted successfully." });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async publishMockTest(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        message: "Reading mock test published successfully.",
        data: await this.readingService.publishMockTest(request.params.id),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }

  async unpublishMockTest(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    try {
      return reply.send({
        success: true,
        message: "Reading mock test unpublished successfully.",
        data: await this.readingService.unpublishMockTest(request.params.id),
      });
    } catch (error) {
      return sendError(reply, error);
    }
  }
}
