import { FastifyReply, FastifyRequest } from "fastify";
import { ReadingService } from "./reading.service";
import { CreateReadingMockTestInput } from "./reading.schemas";

export class ReadingController {
  private readingService = new ReadingService();

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
      const message =
        error instanceof Error ? error.message : "Internal Server Error";

      return reply.status(400).send({
        success: false,
        message,
      });
    }
  }

  async getAllMockTests(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const data = await this.readingService.getAllMockTests();

      return reply.send({
        success: true,
        data,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal Server Error";

      return reply.status(500).send({
        success: false,
        message,
      });
    }
  }

  async getMockTestById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.readingService.getMockTestById(
        request.params.id
      );

      return reply.send({
        success: true,
        data,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal Server Error";

      return reply.status(404).send({
        success: false,
        message,
      });
    }
  }

  async deleteMockTest(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      await this.readingService.deleteMockTest(request.params.id);

      return reply.send({
        success: true,
        message: "Mock test deleted successfully.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal Server Error";

      return reply.status(400).send({
        success: false,
        message,
      });
    }
  }

  async publishMockTest(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.readingService.publishMockTest(
        request.params.id
      );

      return reply.send({
        success: true,
        message: "Mock test published successfully.",
        data,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal Server Error";

      return reply.status(400).send({
        success: false,
        message,
      });
    }
  }

  async unpublishMockTest(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const data = await this.readingService.unpublishMockTest(
        request.params.id
      );

      return reply.send({
        success: true,
        message: "Mock test unpublished successfully.",
        data,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal Server Error";

      return reply.status(400).send({
        success: false,
        message,
      });
    }
  }

  // update mock test
  async updateMockTest(
  request: FastifyRequest<{
    Params: { id: string };
    Body: CreateReadingMockTestInput;
  }>,
  reply: FastifyReply
) {
    try {
      const data = await this.readingService.updateMockTest(
        request.params.id,
        request.body
      );

      return reply.send({
        success: true,
        message: "Reading mock test updated successfully.",
        data,
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal Server Error",
      });
    }
  }

  async getPublishedTests(
  request: FastifyRequest<{
    Querystring: {
      page?: string;
      limit?: string;
    };
  }>,
  reply: FastifyReply
) {
  const page = Number(request.query.page ?? 1);
  const limit = Number(request.query.limit ?? 10);

  const data =
    await this.readingService.getPublishedTests(page, limit);

  return reply.send({
    success: true,
    ...data,
  });
}

async getPublishedTestById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const data = await this.readingService.getPublishedTestById(
    request.params.id
  );

  if (!data) {
    return reply.status(404).send({
      success: false,
      message: "Reading test not found.",
    });
  }

  return reply.send({
      success: true,
      data,
    });
  }
  
}