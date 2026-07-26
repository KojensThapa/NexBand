import assert from "node:assert/strict";
import test from "node:test";

import { createSpeakingSubmissionSchema } from "../src/modules/speaking/speaking.schemas";
import { SpeakingService, SpeakingServiceError } from "../src/modules/speaking/services/speaking.service";

test("speaking service calls only provider ports before persisting part and mock reports", async () => {
  let completed: any;
  const calls = { stt: 0, grammar: 0, pronunciation: 0, relevance: 0 };
  const repository = {
    startSubmission: async () => ({
      id: "submission-1",
      recordings: [
        { id: "recording-1", responseKey: "p1-q1", partNumber: 1 },
        { id: "recording-2", responseKey: "part2-main", partNumber: 2 },
        { id: "recording-3", responseKey: "p3-q1", partNumber: 3 },
      ],
    }),
    completeSubmission: async (_submissionId: string, result: unknown) => {
      completed = result;
      return result;
    },
    markFailed: async () => assert.fail("The happy path must not mark the submission as failed."),
    findSubmissionForUser: async () => null,
  };
  const providers = {
    speechToText: {
      transcribe: async ({ audio }: { audio: { transcript?: string } }) => {
        calls.stt += 1;
        return { transcript: audio.transcript ?? "" };
      },
    },
    grammar: {
      analyze: async () => {
        calls.grammar += 1;
        return { score: 7, errors: [], suggestions: [] };
      },
    },
    pronunciation: {
      analyze: async () => {
        calls.pronunciation += 1;
        return { score: 7, confidenceScore: 0.9, mispronouncedWords: [], supported: true };
      },
    },
    responseRelevance: {
      analyze: async () => {
        calls.relevance += 1;
        return {
          score: 8,
          answeredQuestion: true,
          relevance: "HIGH" as const,
          reason: "The response addresses the prompt.",
          missingPoints: [],
        };
      },
    },
  };
  const service = new SpeakingService(repository as never, providers);
  const input = createSpeakingSubmissionSchema.parse({
    mode: "mock",
    parts: [
      {
        partNumber: 1,
        questionMetadata: { questionCount: 2 },
        recordings: [{ responseKey: "p1-q1", audioUrl: "https://storage.example/p1.webm", durationSeconds: 25, transcript: "I live in Kathmandu and I enjoy its culture." }],
      },
      {
        partNumber: 2,
        recordings: [{ responseKey: "part2-main", audioUrl: "https://storage.example/p2.webm", durationSeconds: 70, transcript: "I would like to describe a memorable journey with my family." }],
      },
      {
        partNumber: 3,
        recordings: [{ responseKey: "p3-q1", audioUrl: "https://storage.example/p3.webm", durationSeconds: 35, transcript: "Travel can support local economies when visitors behave responsibly." }],
      },
    ],
  });

  await service.submit("user-1", input);

  assert.deepEqual(calls, { stt: 3, grammar: 3, pronunciation: 3, relevance: 3 });
  assert.equal(completed.recordingEvaluations.length, 3);
  assert.equal(completed.partReports.length, 3);
  assert.equal(completed.status, "INCOMPLETE");
  assert.equal(completed.partReports[0].status, "INCOMPLETE");
  assert.equal(completed.mockReport.status, "INCOMPLETE");
  assert.equal(completed.mockReport.partNumber, "mock");
});

test("speaking service returns a safe retryable error when PostgreSQL is unavailable", async () => {
  const databaseUnavailable = Object.assign(new Error("connection refused"), { code: "P1001" });
  const repository = {
    startSubmission: async () => {
      throw databaseUnavailable;
    },
    completeSubmission: async () => undefined,
    markFailed: async () => undefined,
    findSubmissionForUser: async () => null,
  };
  const providers = {
    speechToText: { transcribe: async () => ({ transcript: "unused" }) },
    grammar: { analyze: async () => ({ score: 5, errors: [], suggestions: [] }) },
    pronunciation: {
      analyze: async () => ({ score: 5, confidenceScore: 0, mispronouncedWords: [], supported: false }),
    },
  };
  const service = new SpeakingService(repository as never, providers);
  const input = createSpeakingSubmissionSchema.parse({
    mode: "part",
    parts: [
      {
        partNumber: 2,
        recordings: [{ responseKey: "part2-main", audioUrl: "https://storage.example/p2.webm", durationSeconds: 60 }],
      },
    ],
  });

  await assert.rejects(
    () => service.submit("user-1", input),
    (error: unknown) =>
      error instanceof SpeakingServiceError &&
      error.statusCode === 503 &&
      error.message === "The speaking database is temporarily unavailable. Please retry in a moment."
  );
});
