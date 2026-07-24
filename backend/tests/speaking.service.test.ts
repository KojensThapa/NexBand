import assert from "node:assert/strict";
import test from "node:test";

import { createSpeakingSubmissionSchema } from "../src/modules/speaking/speaking.schemas";
import { SpeakingService } from "../src/modules/speaking/services/speaking.service";

test("speaking service calls only provider ports before persisting part and mock reports", async () => {
  let completed: any;
  const calls = { stt: 0, grammar: 0, pronunciation: 0 };
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
  };
  const service = new SpeakingService(repository as never, providers);
  const input = createSpeakingSubmissionSchema.parse({
    mode: "mock",
    parts: [
      {
        partNumber: 1,
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

  assert.deepEqual(calls, { stt: 3, grammar: 3, pronunciation: 3 });
  assert.equal(completed.recordingEvaluations.length, 3);
  assert.equal(completed.partReports.length, 3);
  assert.equal(completed.mockReport.partNumber, "mock");
});

