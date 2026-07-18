import assert from "node:assert/strict";
import test from "node:test";
import {
  createWritingTestSchema,
  toDatabaseWritingCategory,
  toWritingTask1TypeInput,
} from "../src/modules/writing/writing.schemas";

const validTask1 = {
  taskNumber: 1,
  title: "Urban population growth",
  prompt: "The graph below shows population growth in three cities.",
  typeLabel: "Line Graph",
  task1Type: "graph",
  imageUrl: "data:image/png;base64,example-image",
  imageAlt: "Line graph of urban population growth",
};

const validTask2 = {
  taskNumber: 2,
  title: "Technology and relationships",
  prompt: "Discuss both views and give your own opinion.",
  typeLabel: "Essay",
};

test("accepts the frontend's complete two-task mock workflow", () => {
  const result = createWritingTestSchema.safeParse({
    title: "Academic Writing Mock Test 3",
    category: "mock",
    published: false,
    tasks: [validTask1, validTask2],
  });

  assert.equal(result.success, true);
});

test("accepts standalone Task 1 and Task 2 practice workflows", () => {
  const task1 = createWritingTestSchema.safeParse({
    title: validTask1.title,
    category: "task-1",
    tasks: [validTask1],
  });
  const task2 = createWritingTestSchema.safeParse({
    title: validTask2.title,
    category: "task-2",
    tasks: [validTask2],
  });

  assert.equal(task1.success, true);
  assert.equal(task2.success, true);
});

test("does not allow a partial mock or an image-less Task 1", () => {
  const partialMock = createWritingTestSchema.safeParse({
    title: "Incomplete mock",
    category: "mock",
    tasks: [validTask1],
  });
  const task1WithoutImage = createWritingTestSchema.safeParse({
    title: validTask1.title,
    category: "task-1",
    tasks: [{ ...validTask1, imageUrl: undefined }],
  });

  assert.equal(partialMock.success, false);
  assert.equal(task1WithoutImage.success, false);
});

test("maps writing categories and visual types for database storage", () => {
  assert.equal(toDatabaseWritingCategory("task-2"), "TASK_2");
  assert.equal(toWritingTask1TypeInput("PROCESS"), "process");
});
