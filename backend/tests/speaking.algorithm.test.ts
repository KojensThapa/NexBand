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

test("very low response relevance lowers only the final band, not criterion evidence", () => {
  const sharedInput = {
    transcript: "I am thirty years old and I enjoy reading books with my friends at weekends.",
    durationSeconds: 24,
    grammarAnalysis: { score: 8, errors: [], suggestions: [] },
    pronunciationAnalysis: { score: 8, confidenceScore: 0.9, mispronouncedWords: [], supported: true },
    partNumber: 1 as const,
    questionMetadata: { prompt: "What is your name?" },
  };
  const onTopic = evaluateSpeaking({
    ...sharedInput,
    responseRelevanceAnalysis: {
      score: 9,
      answeredQuestion: true,
      relevance: "HIGH",
      reason: "The candidate stated their name.",
      missingPoints: [],
    },
  });
  const offTopic = evaluateSpeaking({
    ...sharedInput,
    responseRelevanceAnalysis: {
      score: 1,
      answeredQuestion: false,
      relevance: "LOW",
      reason: "The candidate gave an age instead of a name.",
      missingPoints: ["State the candidate's name."],
    },
  });

  assert.equal(offTopic.grammarScore, onTopic.grammarScore);
  assert.equal(offTopic.pronunciationScore, onTopic.pronunciationScore);
  assert.ok(offTopic.overallBand < onTopic.overallBand);
  assert.ok(offTopic.overallBand > 0);
});

test("band zero is reserved for an empty or unusable response", () => {
  const result = evaluateSpeaking({
    transcript: "   ",
    durationSeconds: 0,
    grammarAnalysis: { score: 8, errors: [], suggestions: [] },
    pronunciationAnalysis: { score: 8, confidenceScore: 0.9, mispronouncedWords: [], supported: true },
    responseRelevanceAnalysis: {
      score: 1,
      answeredQuestion: false,
      relevance: "LOW",
      reason: "No answer was detected.",
      missingPoints: ["Provide a spoken answer."],
    },
    partNumber: 1,
    questionMetadata: { prompt: "What is your name?" },
  });

  assert.equal(result.overallBand, 0);
});
