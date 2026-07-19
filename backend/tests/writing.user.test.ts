import assert from "node:assert/strict";
import test from "node:test";

import {
  saveWritingDraftSchema,
  submitWritingAttemptSchema,
} from "../src/modules/writing/writing.schemas";
import { toLearnerWritingTest } from "../src/modules/writing/user/writing.user.service";

test("learner writing projection exposes published task data in the frontend shape", () => {
  const writingTest = toLearnerWritingTest({
    id: "writing-test-1",
    title: "Academic Writing Practice",
    category: "TASK_2",
    tasks: [
      {
        id: "task-2",
        taskNumber: 2,
        title: "Technology essay",
        prompt: "Discuss both views.",
        typeLabel: "Discussion essay",
        task1Type: null,
        imageUrl: null,
        imageAlt: null,
      },
    ],
  });

  assert.deepEqual(writingTest, {
    id: "writing-test-1",
    title: "Academic Writing Practice",
    category: "task-2",
    totalMinutes: 40,
    isBackendTest: true,
    tasks: [
      {
        id: "task-2",
        testId: "writing-test-1",
        isBackendTest: true,
        taskNumber: 2,
        label: "Task 2",
        title: "Technology essay",
        prompt: "Discuss both views.",
        minWords: 250,
        recommendedMinutes: 40,
        typeLabel: "Discussion essay",
        task1Type: undefined,
        imageUrl: undefined,
        imageAlt: undefined,
      },
    ],
  });
});

test("writing drafts accept an in-progress essay while submission can include final content", () => {
  assert.equal(
    saveWritingDraftSchema.safeParse({
      essays: [{ taskId: "task-1", content: "" }],
    }).success,
    true
  );

  assert.equal(
    submitWritingAttemptSchema.safeParse({
      essays: [{ taskId: "task-1", content: "Final response" }],
    }).success,
    true
  );
});
