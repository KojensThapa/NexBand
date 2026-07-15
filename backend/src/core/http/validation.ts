import { z } from "zod";

import { AppError } from "../errors/app-error";

export function parseInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown
): z.output<TSchema> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    throw AppError.badRequest("Request validation failed.", parsed.error.flatten());
  }

  return parsed.data;
}
