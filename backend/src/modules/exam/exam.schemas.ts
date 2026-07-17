import { z } from "zod";

import { IELTS_SKILLS } from "../../shared/domain";

const skillSchema = z.enum(IELTS_SKILLS);
const categorySchema = z.enum(["practice", "mock"]);
const contentSchema = z.record(z.string(), z.unknown());

const examFieldsSchema = z.object({
  skill: skillSchema,
  category: categorySchema,
  title: z.string().trim().min(1, "Title is required.").max(180),
  description: z.string().trim().max(1_000).optional(),
  content: contentSchema.default({}),
  answerKey: contentSchema.default({}),
  published: z.boolean().default(false),
});

export const createExamSchema = examFieldsSchema.strict();

export const updateExamSchema = examFieldsSchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Send at least one field to update.");

export const publishExamSchema = z.object({ published: z.boolean() }).strict();

export const examIdSchema = z.object({ id: z.string().uuid("Invalid test id.") }).strict();

export const examListQuerySchema = z
  .object({
    skill: skillSchema.optional(),
  })
  .strict();

export type CreateExamInput = z.output<typeof createExamSchema>;
export type UpdateExamInput = z.output<typeof updateExamSchema>;
