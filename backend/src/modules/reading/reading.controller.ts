import type { FastifyReply, FastifyRequest } from "fastify";

import {
  ReadingService,
  ReadingServiceError,
} from "./reading.service";
import type {
  CreateReadingMockTestInput,
  SaveReadingAnswersInput,
  SubmitReadingAttemptInput,
  UpdateReadingMockTestInput,
} from "./reading.schemas";

type IdParams = { id: string };
type AuthenticatedUser = { id: string; role: string };

function getUserId(request: FastifyRequest): string {
  const user = request.user as AuthenticatedUser;
  return user.id;
}

function sendError(reply: FastifyReply, error: unknown) {
  const statusCode = error instanceof ReadingServiceError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error.";

  return reply.status(statusCode).send({
    success: false,
    message,
  });
}

export class ReadingController {
  constructor(private readonly readingService = new ReadingService()) {}

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
