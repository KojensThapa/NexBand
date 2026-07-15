import type { FastifyInstance } from "fastify";

import { AppError } from "../errors/app-error";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId: request.id,
        },
      });
    }

    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : undefined;

    if (statusCode === 401) {
      return reply.code(401).send({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication is required or the access token is invalid.",
          requestId: request.id,
        },
      });
    }

    request.log.error(error);
    return reply.code(500).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected server error occurred.",
        requestId: request.id,
      },
    });
  });
}
