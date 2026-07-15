import { z } from "zod";

import { IELTS_SKILLS } from "../../shared/domain";

export const submitExamSchema = z
  .object({
    skill: z.enum(IELTS_SKILLS),
    testId: z.string().uuid("Invalid test id.").optional(),
    answers: z.record(z.string(), z.unknown()).default({}),
    responseText: z.string().trim().max(50_000).optional(),
    timeTakenSeconds: z.number().int().nonnegative().max(86_400).optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value.answers).length > 0 || Boolean(value.responseText),
    "Provide answers or a written response."
  );

export const submissionIdSchema = z.object({ id: z.string().uuid("Invalid submission id.") }).strict();

export type SubmitExamInput = z.output<typeof submitExamSchema>;
