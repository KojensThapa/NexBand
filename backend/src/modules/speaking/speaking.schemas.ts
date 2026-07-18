import { z } from "zod";

const speakingCategories = ["mock", "part-1", "part-2", "part-3"] as const;

export const speakingCategorySchema = z.enum(speakingCategories);

export type SpeakingCategoryInput = z.infer<typeof speakingCategorySchema>;

const databaseCategoryByInput: Record<
  SpeakingCategoryInput,
  "MOCK" | "PART_1" | "PART_2" | "PART_3"
> = {
  mock: "MOCK",
  "part-1": "PART_1",
  "part-2": "PART_2",
  "part-3": "PART_3",
};

const inputCategoryByDatabase: Record<string, SpeakingCategoryInput> = {
  MOCK: "mock",
  PART_1: "part-1",
  PART_2: "part-2",
  PART_3: "part-3",
};

export function toDatabaseSpeakingCategory(category: SpeakingCategoryInput) {
  return databaseCategoryByInput[category];
}

export function toSpeakingCategoryInput(category: string): SpeakingCategoryInput {
  return inputCategoryByDatabase[category] ?? "mock";
}

const optionalQuestionIdSchema = z.string().trim().min(1).max(191).optional();

const speakingQuestionSchema = z.object({
  // Question IDs are accepted so the existing edit form can submit its current
  // state. Ordering is persisted by array position and database IDs are returned.
  id: optionalQuestionIdSchema,
  text: z.string().trim().min(1, "Question text is required").max(5_000),
});

const speakingPart1Schema = z.object({
  questions: z.array(speakingQuestionSchema).max(50),
});

const speakingPart2Schema = z.object({
  cueCardTitle: z.string().trim().max(500),
  cueCardDescription: z.string().trim().max(5_000),
  bulletPoints: z.array(z.string().trim().max(1_000)).max(4),
  closingQuestion: z.string().trim().max(2_000),
  preparationMinutes: z.number().int().min(1).max(5),
  speakingMinutes: z.number().int().min(1).max(5),
});

const speakingPart3Schema = z.object({
  topic: z.string().trim().max(500),
  questions: z.array(speakingQuestionSchema).max(50),
});

const speakingMockTestShape = z.object({
  // Accepted to support the existing form's create/edit payload. The route ID is
  // authoritative during an update and this value is never persisted directly.
  id: z.string().trim().min(1).max(191).optional(),
  title: z.string().trim().min(1, "A title is required").max(500),
  category: speakingCategorySchema,
  published: z.boolean().optional(),
  part1: speakingPart1Schema,
  part2: speakingPart2Schema,
  part3: speakingPart3Schema,
});

function validateRequiredPart(
  condition: boolean,
  context: z.RefinementCtx,
  path: (string | number)[],
  message: string
) {
  if (!condition) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message,
    });
  }
}

export const createSpeakingMockTestSchema = speakingMockTestShape.superRefine(
  (data, context) => {
    const includesPart1 = data.category === "mock" || data.category === "part-1";
    const includesPart2 = data.category === "mock" || data.category === "part-2";
    const includesPart3 = data.category === "mock" || data.category === "part-3";

    if (includesPart1) {
      validateRequiredPart(
        data.part1.questions.length > 0,
        context,
        ["part1", "questions"],
        "Add at least one Part 1 interview question."
      );
    }

    if (includesPart2) {
      const filledBulletPoints = data.part2.bulletPoints.filter(Boolean);

      validateRequiredPart(
        Boolean(data.part2.cueCardTitle),
        context,
        ["part2", "cueCardTitle"],
        "A cue card title is required."
      );
      validateRequiredPart(
        Boolean(data.part2.cueCardDescription),
        context,
        ["part2", "cueCardDescription"],
        "A cue card description is required."
      );
      validateRequiredPart(
        filledBulletPoints.length >= 3 && filledBulletPoints.length <= 4,
        context,
        ["part2", "bulletPoints"],
        "Provide between 3 and 4 cue card bullet points."
      );
      validateRequiredPart(
        Boolean(data.part2.closingQuestion),
        context,
        ["part2", "closingQuestion"],
        "A Part 2 closing question is required."
      );
    }

    if (includesPart3) {
      validateRequiredPart(
        Boolean(data.part3.topic),
        context,
        ["part3", "topic"],
        "A Part 3 discussion topic is required."
      );
      validateRequiredPart(
        data.part3.questions.length > 0,
        context,
        ["part3", "questions"],
        "Add at least one Part 3 discussion question."
      );
    }
  }
);

export type CreateSpeakingMockTestInput = z.infer<
  typeof createSpeakingMockTestSchema
>;

// Updates replace the nested parts and their ordered questions, so the full
// payload is required just as it is when creating an item.
export const updateSpeakingMockTestSchema = createSpeakingMockTestSchema;

export type UpdateSpeakingMockTestInput = z.infer<
  typeof updateSpeakingMockTestSchema
>;
