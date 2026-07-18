import type { Prisma } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { SpeakingService } from "./speaking.service";
import {
  type CreateSpeakingMockTestInput,
  speakingCategorySchema,
  toSpeakingCategoryInput,
} from "./speaking.schemas";

type SpeakingMockTestWithContent = Prisma.SpeakingMockTestGetPayload<{
  include: {
    parts: {
      include: {
        questions: true;
      };
    };
  };
}>;

function serializeMockTest(mockTest: SpeakingMockTestWithContent) {
  const { isPublished, category, parts, ...test } = mockTest;
  const partsByNumber = new Map(parts.map((part) => [part.partNumber, part]));
  const part1 = partsByNumber.get(1);
  const part2 = partsByNumber.get(2);
  const part3 = partsByNumber.get(3);

  return {
    ...test,
    category: toSpeakingCategoryInput(category),
    published: isPublished,
    part1: {
      questions: (part1?.questions ?? []).map((question) => ({
        id: question.id,
        text: question.text,
      })),
    },
    part2: {
      cueCardTitle: part2?.cueCardTitle ?? "",
      cueCardDescription: part2?.cueCardDescription ?? "",
      bulletPoints: part2?.bulletPoints ?? [],
      closingQuestion: part2?.closingQuestion ?? "",
      preparationMinutes: part2?.preparationMinutes ?? 1,
      speakingMinutes: part2?.speakingMinutes ?? 2,
    },
    part3: {
      topic: part3?.topic ?? "",
      questions: (part3?.questions ?? []).map((question) => ({
        id: question.id,
        text: question.text,
      })),
    },
  };
}

function parsePositiveInteger(value: string | undefined, fallback: number, maximum: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, maximum);
}

export class SpeakingController {
  private speakingService = new SpeakingService();

  async createMockTest(
    request: FastifyRequest<{ Body: CreateSpeakingMockTestInput }>,
    reply: FastifyReply
  ) {
    try {
      const mockTest = await this.speakingService.createMockTest(request.body);

      return reply.status(201).send({
        success: true,
        message: "Speaking content created successfully.",
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
      const data = await this.speakingService.getAllMockTests();

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
      const data = await this.speakingService.getMockTestById(request.params.id);

      if (!data) {
        return reply.status(404).send({
          success: false,
          message: "Speaking content not found.",
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
      Body: CreateSpeakingMockTestInput;
    }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.speakingService.updateMockTest(
        request.params.id,
        request.body
      );

      return reply.send({
        success: true,
        message: "Speaking content updated successfully.",
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
      await this.speakingService.deleteMockTest(request.params.id);

      return reply.send({
        success: true,
        message: "Speaking content deleted successfully.",
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
      const data = await this.speakingService.publishMockTest(request.params.id);

      return reply.send({
        success: true,
        message: "Speaking content published successfully.",
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
      const data = await this.speakingService.unpublishMockTest(request.params.id);

      return reply.send({
        success: true,
        message: "Speaking content unpublished successfully.",
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
      Querystring: { page?: string; limit?: string; category?: string };
    }>,
    reply: FastifyReply
  ) {
    const categoryResult = request.query.category
      ? speakingCategorySchema.safeParse(request.query.category)
      : undefined;

    if (categoryResult && !categoryResult.success) {
      return reply.status(400).send({
        success: false,
        message: "Invalid speaking category.",
      });
    }

    const page = parsePositiveInteger(request.query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = parsePositiveInteger(request.query.limit, 10, 100);
    const data = await this.speakingService.getPublishedTests(
      page,
      limit,
      categoryResult?.data
    );

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
    const data = await this.speakingService.getPublishedTestById(request.params.id);

    if (!data) {
      return reply.status(404).send({
        success: false,
        message: "Speaking test not found.",
      });
    }

    return reply.send({
      success: true,
      data: serializeMockTest(data),
    });
  }
}
