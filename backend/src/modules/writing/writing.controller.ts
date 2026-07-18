import type { Prisma } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { WritingService } from "./writing.service";
import {
  type CreateWritingTestInput,
  toWritingCategoryInput,
  toWritingTask1TypeInput,
  writingCategorySchema,
} from "./writing.schemas";

type WritingTestWithTasks = Prisma.WritingTestGetPayload<{
  include: {
    tasks: true;
  };
}>;

function serializeTest(test: WritingTestWithTasks) {
  const { isPublished, category, tasks, ...writingTest } = test;

  return {
    ...writingTest,
    category: toWritingCategoryInput(category),
    published: isPublished,
    tasks: tasks.map((task) => ({
      ...task,
      task1Type:
        task.task1Type === null
          ? undefined
          : toWritingTask1TypeInput(task.task1Type),
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

export class WritingController {
  private writingService = new WritingService();

  async createTest(
    request: FastifyRequest<{ Body: CreateWritingTestInput }>,
    reply: FastifyReply
  ) {
    try {
      const test = await this.writingService.createTest(request.body);

      return reply.status(201).send({
        success: true,
        message: "Writing content created successfully.",
        data: serializeTest(test),
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  }

  async getAllTests(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await this.writingService.getAllTests();

      return reply.send({
        success: true,
        data: data.map(serializeTest),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  }

  async getTestById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.writingService.getTestById(request.params.id);

      if (!data) {
        return reply.status(404).send({
          success: false,
          message: "Writing content not found.",
        });
      }

      return reply.send({
        success: true,
        data: serializeTest(data),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  }

  async updateTest(
    request: FastifyRequest<{
      Params: { id: string };
      Body: CreateWritingTestInput;
    }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.writingService.updateTest(request.params.id, request.body);

      return reply.send({
        success: true,
        message: "Writing content updated successfully.",
        data: serializeTest(data),
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  }

  async deleteTest(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      await this.writingService.deleteTest(request.params.id);

      return reply.send({
        success: true,
        message: "Writing content deleted successfully.",
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  }

  async publishTest(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.writingService.publishTest(request.params.id);

      return reply.send({
        success: true,
        message: "Writing content published successfully.",
        data: serializeTest(data),
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  }

  async unpublishTest(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.writingService.unpublishTest(request.params.id);

      return reply.send({
        success: true,
        message: "Writing content unpublished successfully.",
        data: serializeTest(data),
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
      ? writingCategorySchema.safeParse(request.query.category)
      : undefined;

    if (categoryResult && !categoryResult.success) {
      return reply.status(400).send({
        success: false,
        message: "Invalid writing category.",
      });
    }

    const page = parsePositiveInteger(request.query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = parsePositiveInteger(request.query.limit, 10, 100);
    const data = await this.writingService.getPublishedTests(
      page,
      limit,
      categoryResult?.data
    );

    return reply.send({
      success: true,
      tests: data.tests.map(serializeTest),
      pagination: data.pagination,
    });
  }

  async getPublishedTestById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const data = await this.writingService.getPublishedTestById(request.params.id);

    if (!data) {
      return reply.status(404).send({
        success: false,
        message: "Writing test not found.",
      });
    }

    return reply.send({
      success: true,
      data: serializeTest(data),
    });
  }
}
