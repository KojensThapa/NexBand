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

  options: z.any().optional(),

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