import { FastifyReply, FastifyRequest } from "fastify";
import type { Prisma } from "@prisma/client";
import { ListeningService } from "./listening.service";
import {
  CreateListeningMockTestInput,
  toListeningQuestionTypeInput,
} from "./listening.schemas";

type ListeningMockTestWithContent = Prisma.ListeningMockTestGetPayload<{
  include: {
    parts: {
      include: {
        questions: true;
      };
    };
  };
}>;

function serializeMockTest(mockTest: ListeningMockTestWithContent) {
  const { isPublished, parts, ...test } = mockTest;

  return {
    ...test,
    published: isPublished,
    parts: parts.map((part) => ({
      ...part,
      questions: part.questions.map((question) => ({
        ...question,
        type: toListeningQuestionTypeInput(question.type),
      })),
    })),
  };
}

function parsePositiveInteger(value: string | undefined, fallback: number, maximum: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, maximum);
}

export class ListeningController {
  private listeningService = new ListeningService();

  async createMockTest(
    request: FastifyRequest<{ Body: CreateListeningMockTestInput }>,
    reply: FastifyReply
  ) {
    try {
      const mockTest = await this.listeningService.createMockTest(request.body);

      return reply.status(201).send({
        success: true,
        message: "Listening mock test created successfully.",
        data: serializeMockTest(mockTest),
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  }

  async getAllMockTests(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await this.listeningService.getAllMockTests();

      return reply.send({
        success: true,
        data: data.map(serializeMockTest),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  }

  async getMockTestById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.listeningService.getMockTestById(request.params.id);

      if (!data) {
        return reply.status(404).send({
          success: false,
          message: "Listening mock test not found.",
        });
      }

      return reply.send({
        success: true,
        data: serializeMockTest(data),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  }

  async updateMockTest(
    request: FastifyRequest<{
      Params: { id: string };
      Body: CreateListeningMockTestInput;
    }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.listeningService.updateMockTest(
        request.params.id,
        request.body
      );

      return reply.send({
        success: true,
        message: "Listening mock test updated successfully.",
        data: serializeMockTest(data),
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  }

  async deleteMockTest(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      await this.listeningService.deleteMockTest(request.params.id);

      return reply.send({
        success: true,
        message: "Listening mock test deleted successfully.",
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  }

  async publishMockTest(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.listeningService.publishMockTest(request.params.id);

      return reply.send({
        success: true,
        message: "Listening mock test published successfully.",
        data: serializeMockTest(data),
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  }

  async unpublishMockTest(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.listeningService.unpublishMockTest(request.params.id);

      return reply.send({
        success: true,
        message: "Listening mock test unpublished successfully.",
        data: serializeMockTest(data),
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  }

  async getPublishedTests(
    request: FastifyRequest<{
      Querystring: { page?: string; limit?: string };
    }>,
    reply: FastifyReply
  ) {
    const page = parsePositiveInteger(request.query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = parsePositiveInteger(request.query.limit, 10, 100);
    const data = await this.listeningService.getPublishedTests(page, limit);

    return reply.send({
      success: true,
      tests: data.tests.map(serializeMockTest),
      pagination: data.pagination,
    });
  }

  async getPublishedTestById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const data = await this.listeningService.getPublishedTestById(request.params.id);

    if (!data) {
      return reply.status(404).send({
        success: false,
        message: "Listening test not found.",
      });
    }

    return reply.send({
      success: true,
      data: serializeMockTest(data),
    });
  }
}
