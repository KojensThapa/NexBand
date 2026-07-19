import { z } from "zod";

/**
 * Reading Question
 */
export const readingQuestionSchema = z.object({
  questionNumber: z.number().int().positive(),

  type: z.enum([
    "MULTIPLE_CHOICE",
    "TRUE_FALSE_NOT_GIVEN",
    "MATCHING_HEADING",
    "MATCHING_INFORMATION",
    "MATCHING_FEATURES",
    "MATCHING_SENTENCE_ENDINGS",
    "SENTENCE_COMPLETION",
    "SUMMARY_COMPLETION",
    "NOTE_COMPLETION",
    "TABLE_COMPLETION",
    "FLOW_CHART_COMPLETION",
    "DIAGRAM_LABELLING",
    "SHORT_ANSWER",
  ]),

  questionText: z
    .string()
    .min(1, "Question text is required"),

  // The learner UI renders a single selected string value, so options are
  // intentionally constrained to plain labels instead of arbitrary JSON.
  options: z.array(z.string().min(1)).max(20).optional(),

  correctAnswer: z
    .array(z.string())
    .min(1, "At least one correct answer is required"),

  marks: z
    .number()
    .int()
    .min(1),

  explanation: z.string().optional(),
});

/**
 * Reading Passage
 */
export const readingPassageSchema = z.object({
  passageNumber: z
    .number()
    .int()
    .min(1)
    .max(3),

  title: z
    .string()
    .min(3),

  instruction: z
    .string()
    .optional(),

  passageText: z
    .string()
    .min(50, "Passage is too short"),

  imageUrl: z
    .string()
    .optional(),

  questions: z
    .array(readingQuestionSchema)
    .min(1, "At least one question is required"),
});

/**
 * Reading Mock Test
 */
export const createReadingMockTestSchema = z.object({
  title: z
    .string()
    .min(5),

  tags: z
    .array(z.string())
    .min(1, "At least one tag is required"),

  duration: z
    .number()
    .int()
    .min(1)
    .default(60),


  passages: z
    .array(readingPassageSchema)
    .length(3, "Reading mock test must contain exactly 3 passages"),
});

export type CreateReadingMockTestInput =
  z.infer<typeof createReadingMockTestSchema>;

export const updateReadingMockTestSchema = createReadingMockTestSchema.partial();

export type UpdateReadingMockTestInput =
  z.infer<typeof updateReadingMockTestSchema>;

/** Learner attempt input. Keys are ReadingQuestion IDs and values are the answers shown in the UI. */
export const readingAnswersSchema = z
  .record(z.string().min(1), z.string().max(5_000))
  .refine((answers) => Object.keys(answers).length <= 200, {
    message: "Too many answers supplied.",
  });

export const saveReadingAnswersSchema = z.object({
  answers: readingAnswersSchema,
});

export const submitReadingAttemptSchema = z.object({
  // Supplying answers here is optional. It lets a client submit its most
  // recent local changes without waiting for an autosave request to finish.
  answers: readingAnswersSchema.optional(),
});

export const readingIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const publishedReadingTestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type ReadingAnswers = z.infer<typeof readingAnswersSchema>;
export type SaveReadingAnswersInput = z.infer<typeof saveReadingAnswersSchema>;
export type SubmitReadingAttemptInput = z.infer<typeof submitReadingAttemptSchema>;
