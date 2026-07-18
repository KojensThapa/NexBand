import { z } from "zod";

const listeningQuestionTypes = [
  "multiple-choice",
  "form-completion",
  "note-completion",
  "table-completion",
  "summary-completion",
  "sentence-completion",
  "matching",
  "map-labelling",
  "short-answer",
] as const;

export const listeningQuestionTypeSchema = z.enum(listeningQuestionTypes);

export type ListeningQuestionTypeInput = z.infer<
  typeof listeningQuestionTypeSchema
>;

const databaseQuestionTypeByInput: Record<
  ListeningQuestionTypeInput,
  | "MULTIPLE_CHOICE"
  | "FORM_COMPLETION"
  | "NOTE_COMPLETION"
  | "TABLE_COMPLETION"
  | "SUMMARY_COMPLETION"
  | "SENTENCE_COMPLETION"
  | "MATCHING"
  | "MAP_LABELLING"
  | "SHORT_ANSWER"
> = {
  "multiple-choice": "MULTIPLE_CHOICE",
  "form-completion": "FORM_COMPLETION",
  "note-completion": "NOTE_COMPLETION",
  "table-completion": "TABLE_COMPLETION",
  "summary-completion": "SUMMARY_COMPLETION",
  "sentence-completion": "SENTENCE_COMPLETION",
  matching: "MATCHING",
  "map-labelling": "MAP_LABELLING",
  "short-answer": "SHORT_ANSWER",
};

const inputQuestionTypeByDatabase: Record<string, ListeningQuestionTypeInput> = {
  MULTIPLE_CHOICE: "multiple-choice",
  FORM_COMPLETION: "form-completion",
  NOTE_COMPLETION: "note-completion",
  TABLE_COMPLETION: "table-completion",
  SUMMARY_COMPLETION: "summary-completion",
  SENTENCE_COMPLETION: "sentence-completion",
  MATCHING: "matching",
  MAP_LABELLING: "map-labelling",
  SHORT_ANSWER: "short-answer",
};

export function toDatabaseListeningQuestionType(
  type: ListeningQuestionTypeInput
) {
  return databaseQuestionTypeByInput[type];
}

export function toListeningQuestionTypeInput(
  type: string
): ListeningQuestionTypeInput {
  return inputQuestionTypeByDatabase[type] ?? "short-answer";
}

export const listeningQuestionSchema = z.object({
  questionNumber: z.number().int().min(1).max(20),
  type: listeningQuestionTypeSchema,
  questionText: z.string().trim().min(1, "Question text is required"),
  options: z.array(z.string().trim()).max(10).optional().default([]),
  correctAnswer: z.string().trim().min(1, "A correct answer is required"),
  marks: z.number().int().min(1).max(10),
  explanation: z.string().trim().optional(),
});

export const listeningPartSchema = z
  .object({
    partNumber: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    title: z.string().trim().min(1, "Part title is required"),
    instruction: z.string().trim().min(1, "Part instruction is required"),
    transcript: z.string().trim().optional(),
    // The existing admin flow stores newly uploaded files in IndexedDB before
    // a server-hosted URL is available, so either source is accepted.
    audioStorageKey: z.string().trim().min(1).optional(),
    audioUrl: z.string().min(1).optional(),
    audioDurationSeconds: z.number().int().min(1),
    mapImageUrl: z.string().min(1).optional(),
    mapImageAlt: z.string().trim().optional(),
    questions: z.array(listeningQuestionSchema).min(1).max(20),
  })
  .refine((part) => Boolean(part.audioStorageKey || part.audioUrl), {
    message: "Each part requires an audio source.",
    path: ["audioUrl"],
  });

const listeningMockTestShape = z.object({
  title: z.string().trim().min(1, "Mock test title is required"),
  iconStyle: z.enum(["headphones", "broadcast", "microphone"]),
  // This is optional so updates can leave publication unchanged. The admin
  // interface currently sends it, and publish/unpublish routes remain available.
  published: z.boolean().optional(),
  parts: z.array(listeningPartSchema).length(4, "A listening mock test must contain exactly 4 parts"),
});

export const createListeningMockTestSchema = listeningMockTestShape.superRefine(
  (data, context) => {
    const partNumbers = new Set<number>(data.parts.map((part) => part.partNumber));

    if (partNumbers.size !== 4 || ![1, 2, 3, 4].every((part) => partNumbers.has(part))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Listening mock tests must contain one each of parts 1, 2, 3, and 4.",
        path: ["parts"],
      });
    }

    data.parts.forEach((part, partIndex) => {
      const usedQuestionNumbers = new Set<number>();

      part.questions.forEach((question, questionIndex) => {
        if (usedQuestionNumbers.has(question.questionNumber)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Question number ${question.questionNumber} is duplicated in part ${part.partNumber}.`,
            path: ["parts", partIndex, "questions", questionIndex, "questionNumber"],
          });
        }

        usedQuestionNumbers.add(question.questionNumber);
      });
    });
  }
);

export type CreateListeningMockTestInput = z.infer<
  typeof createListeningMockTestSchema
>;

// Replacing a mock test rebuilds its parts and questions, so a complete four-part
// payload is required for updates as well.
export const updateListeningMockTestSchema = createListeningMockTestSchema;

export type UpdateListeningMockTestInput = z.infer<
  typeof updateListeningMockTestSchema
>;
