import { z } from "zod";

const writingCategories = ["mock", "task-1", "task-2"] as const;
const task1Types = [
  "graph",
  "chart",
  "table",
  "map",
  "process",
  "diagram",
  "pie",
] as const;

export const writingCategorySchema = z.enum(writingCategories);
export const writingTask1TypeSchema = z.enum(task1Types);

export type WritingCategoryInput = z.infer<typeof writingCategorySchema>;
export type WritingTask1TypeInput = z.infer<typeof writingTask1TypeSchema>;

const databaseCategoryByInput: Record<
  WritingCategoryInput,
  "MOCK" | "TASK_1" | "TASK_2"
> = {
  mock: "MOCK",
  "task-1": "TASK_1",
  "task-2": "TASK_2",
};

const inputCategoryByDatabase: Record<string, WritingCategoryInput> = {
  MOCK: "mock",
  TASK_1: "task-1",
  TASK_2: "task-2",
};

const databaseTask1TypeByInput: Record<
  WritingTask1TypeInput,
  "GRAPH" | "CHART" | "TABLE" | "MAP" | "PROCESS" | "DIAGRAM" | "PIE"
> = {
  graph: "GRAPH",
  chart: "CHART",
  table: "TABLE",
  map: "MAP",
  process: "PROCESS",
  diagram: "DIAGRAM",
  pie: "PIE",
};

const inputTask1TypeByDatabase: Record<string, WritingTask1TypeInput> = {
  GRAPH: "graph",
  CHART: "chart",
  TABLE: "table",
  MAP: "map",
  PROCESS: "process",
  DIAGRAM: "diagram",
  PIE: "pie",
};

export function toDatabaseWritingCategory(category: WritingCategoryInput) {
  return databaseCategoryByInput[category];
}

export function toWritingCategoryInput(category: string): WritingCategoryInput {
  return inputCategoryByDatabase[category] ?? "task-1";
}

export function toDatabaseWritingTask1Type(type: WritingTask1TypeInput) {
  return databaseTask1TypeByInput[type];
}

export function toWritingTask1TypeInput(type: string): WritingTask1TypeInput {
  return inputTask1TypeByDatabase[type] ?? "graph";
}

const writingTaskSchema = z.object({
  // The UI retains task IDs in an edit draft. They are accepted here while the
  // server remains responsible for persistent IDs.
  id: z.string().trim().min(1).max(191).optional(),
  taskNumber: z.union([z.literal(1), z.literal(2)]),
  title: z.string().trim().min(1, "A task title is required").max(500),
  prompt: z.string().trim().min(1, "A task prompt is required").max(10_000),
  typeLabel: z.string().trim().min(1).max(100).optional(),
  task1Type: writingTask1TypeSchema.optional(),
  // Data URLs are used by the current 5 MB image upload flow, so validation
  // intentionally allows their base64-encoded size.
  imageUrl: z.string().trim().min(1).max(10_000_000).optional(),
  imageAlt: z.string().trim().min(1).max(500).optional(),
});

const writingTestShape = z.object({
  id: z.string().trim().min(1).max(191).optional(),
  title: z.string().trim().min(1, "A writing test title is required").max(500),
  category: writingCategorySchema,
  published: z.boolean().optional(),
  tasks: z.array(writingTaskSchema).min(1).max(2),
});

function addValidationError(
  context: z.RefinementCtx,
  path: (string | number)[],
  message: string
) {
  context.addIssue({
    code: z.ZodIssueCode.custom,
    path,
    message,
  });
}

function validateTask1(task: z.infer<typeof writingTaskSchema>, taskIndex: number, context: z.RefinementCtx) {
  if (!task.task1Type) {
    addValidationError(context, ["tasks", taskIndex, "task1Type"], "Task 1 requires a visual type.");
  }

  if (!task.imageUrl) {
    addValidationError(context, ["tasks", taskIndex, "imageUrl"], "Task 1 requires a chart, map, or diagram image.");
  }
}

export const createWritingTestSchema = writingTestShape.superRefine((data, context) => {
  const task1Index = data.tasks.findIndex((task) => task.taskNumber === 1);
  const task2Index = data.tasks.findIndex((task) => task.taskNumber === 2);

  if (data.category === "mock") {
    if (data.tasks.length !== 2 || task1Index === -1 || task2Index === -1) {
      addValidationError(
        context,
        ["tasks"],
        "A writing mock test must contain exactly one Task 1 and one Task 2."
      );
      return;
    }

    validateTask1(data.tasks[task1Index]!, task1Index, context);
    return;
  }

  const requiredTaskNumber = data.category === "task-1" ? 1 : 2;
  if (data.tasks.length !== 1 || data.tasks[0]?.taskNumber !== requiredTaskNumber) {
    addValidationError(
      context,
      ["tasks"],
      `${data.category === "task-1" ? "Task 1" : "Task 2"} practice must contain exactly one matching task.`
    );
    return;
  }

  if (data.category === "task-1") {
    validateTask1(data.tasks[0], 0, context);
  }
});

export type CreateWritingTestInput = z.infer<typeof createWritingTestSchema>;

// Updating a writing item replaces the complete task list, preventing a mock
// test from being left in a partially updated state.
export const updateWritingTestSchema = createWritingTestSchema;

export type UpdateWritingTestInput = z.infer<typeof updateWritingTestSchema>;

export const publishedWritingTestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: writingCategorySchema.optional(),
});

const writingEssaySchema = z.object({
  taskId: z.string().trim().min(1).max(191),
  // Drafts may be empty while the learner is composing. Submission requires
  // at least one non-empty saved essay in the service layer.
  content: z.string().max(50_000),
});

export const saveWritingDraftSchema = z.object({
  essays: z.array(writingEssaySchema).min(1).max(2),
});

export const submitWritingAttemptSchema = z.object({
  // The current editor sends its latest contents here as well as autosaving,
  // so a final keystroke is never lost if a draft request is still in flight.
  essays: z.array(writingEssaySchema).max(2).optional(),
});

export type WritingEssayInput = z.infer<typeof writingEssaySchema>;
export type SaveWritingDraftInput = z.infer<typeof saveWritingDraftSchema>;
export type SubmitWritingAttemptInput = z.infer<typeof submitWritingAttemptSchema>;
