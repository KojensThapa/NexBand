import type { Prisma } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";

import type { CreateListeningMockTestInput } from "../listening.schemas";
import { toListeningQuestionTypeInput } from "../listening.schemas";
import { ListeningAdminService } from "./listening.admin.service";

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

/** HTTP adapter for admin-only Listening authoring endpoints. */
export class ListeningAdminController {
  constructor(private readonly listeningService = new ListeningAdminService()) {}

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

  async getAllMockTests(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await this.listeningService.getAllMockTests();
      return reply.send({ success: true, data: data.map(serializeMockTest) });
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
      return reply.send({ success: true, data: serializeMockTest(data) });
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
      const data = await this.listeningService.updateMockTest(request.params.id, request.body);
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
      return reply.send({ success: true, message: "Listening mock test deleted successfully." });
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
}
