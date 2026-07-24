import assert from "node:assert/strict";
import test from "node:test";

import { cefrFromIeltsBand } from "../src/modules/speaking/algorithm/bandCalculator";
import { evaluateSpeaking } from "../src/modules/speaking/algorithm/speakingAlgorithm";

test("deterministic speaking evaluation uses provider results but no provider calls", () => {
  const result = evaluateSpeaking({
    transcript:
      "Um, I enjoy sustainable travel because it is educational and memorable. You know, I usually choose trains because they are comfortable. Actually, travelling slowly lets me understand local culture.",
    durationSeconds: 18,
    grammarAnalysis: { score: 7, errors: [], suggestions: [] },
    pronunciationAnalysis: {
      score: 7.5,
      confidenceScore: 0.88,
      mispronouncedWords: [{ word: "sustainable" }],
      supported: true,
    },
    partNumber: 2,
    questionMetadata: { topic: "Travel", questionCount: 1 },
    vocabularyDataset: { isAdvancedWord: (word) => word === "sustainable" || word === "educational" },
  });

  assert.equal(result.status, "COMPLETED");
  assert.equal(result.partNumber, 2);
  assert.equal(result.fillerWords.count, 3);
  assert.equal(result.fluency.speakingPace, "NORMAL");
  assert.equal(result.vocabulary.advancedWordCount, 2);
  assert.equal(result.overallBand * 2, Math.round(result.overallBand * 2));
  assert.ok(result.recommendations.some((recommendation) => recommendation.includes("filler words")));
  assert.deepEqual(result.mispronouncedWords, [{ word: "sustainable" }]);
});

test("the CEFR conversion follows the documented IELTS band thresholds", () => {
  assert.equal(cefrFromIeltsBand(2.5), "A1");
  assert.equal(cefrFromIeltsBand(3), "A2");
  assert.equal(cefrFromIeltsBand(4), "B1");
  assert.equal(cefrFromIeltsBand(5.5), "B2");
  assert.equal(cefrFromIeltsBand(7), "C1");
  assert.equal(cefrFromIeltsBand(8.5), "C2");
});
