import type { SpeakingRecordings } from "../speaking.schemas";
import { calculateOverallBand, cefrFromIeltsBand } from "./bandCalculator";
import { analyzeFillerWords } from "./fillerWordAnalyzer";
import { generateFeedback } from "./feedbackGenerator";
import { calculateFluency } from "./fluencyCalculator";
import { generateRecommendations } from "./recommendationEngine";
import type { SpeakingEvaluationInput, SpeakingEvaluationResult } from "./types";
import { calculateVocabulary } from "./vocabularyCalculator";

function toBandScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  // Some vendors expose accuracy as 0–100. Normalise it once at the boundary.
  const bandScore = score > 9 ? (score / 100) * 9 : score;
  return Math.max(0, Math.min(9, Number(bandScore.toFixed(2))));
}

/**
 * Deterministically evaluates data already returned by provider adapters.
 * This function deliberately has no network, framework, database, or AI-SDK
 * dependency, so it is safe to test and replace datasets around.
 */
export function evaluateSpeaking(input: SpeakingEvaluationInput): SpeakingEvaluationResult {
  const transcript = input.transcript.trim();
  const fluency = calculateFluency(transcript, input.durationSeconds);
  const vocabulary = calculateVocabulary(transcript, input.vocabularyDataset);
  const fillerWords = analyzeFillerWords(transcript, fluency.totalWords);
  const fluencyScore = Math.max(0, Number((fluency.score - fillerWords.penalty).toFixed(2)));
  const grammar = { ...input.grammarAnalysis, score: toBandScore(input.grammarAnalysis.score) };
  const pronunciation = {
    ...input.pronunciationAnalysis,
    score: toBandScore(input.pronunciationAnalysis.score),
    confidenceScore: Math.max(0, Math.min(1, input.pronunciationAnalysis.confidenceScore)),
  };
  const feedbackInput = { fluency: { ...fluency, score: fluencyScore }, vocabulary, grammar, pronunciation, fillerWords };
  const overallBand = calculateOverallBand({
    fluencyScore,
    vocabularyScore: vocabulary.score,
    grammarScore: grammar.score,
    pronunciationScore: pronunciation.score,
  });
  const feedback = generateFeedback(feedbackInput);
  const strengths = [...feedback.strengths];
  const weakAreas = [...feedback.weakAreas];
  const recommendations = generateRecommendations(feedbackInput, input.partNumber);
  const expectedDuration = input.questionMetadata.expectedDurationSeconds;
  if (expectedDuration && input.durationSeconds < expectedDuration * 0.6) {
    weakAreas.push("Response is shorter than the target duration for this question.");
    recommendations.push("Develop each answer with a reason and an example to reach the target response length.");
  } else if (expectedDuration && input.durationSeconds >= expectedDuration) {
    strengths.push("Response duration meets the target for this question.");
  }
  if (input.questionMetadata.topic && vocabulary.score < 6) {
    recommendations.push(`Build a topic word bank for ${input.questionMetadata.topic} before your next attempt.`);
  }

  return {
    status: "COMPLETED",
    partNumber: input.partNumber,
    transcript,
    duration: input.durationSeconds,
    wordsPerMinute: fluency.wordsPerMinute,
    fluencyScore,
    vocabularyScore: vocabulary.score,
    grammarScore: grammar.score,
    pronunciationScore: pronunciation.score,
    overallBand,
    cefrLevel: cefrFromIeltsBand(overallBand),
    fillerWords,
    mispronouncedWords: pronunciation.mispronouncedWords,
    strengths: [...new Set(strengths)],
    weakAreas: [...new Set(weakAreas)],
    recommendations: [...new Set(recommendations)],
    fluency: { ...fluency, score: fluencyScore },
    vocabulary,
    grammar,
    pronunciation,
    algorithmVersion: "speaking-v1",
  };
}

export type BasicSpeakingEvaluation = {
  recordingCount: number;
  totalQuestions: number;
  totalDurationSeconds: number;
  completionPercentage: number;
  basicScore: number;
  estimatedBandScore: number;
  evaluationMode: "BASIC";
  algorithmVersion: "basic-v1";
  feedback: { summary: string; strengths: string[]; improvements: string[] };
};

/**
 * Compatibility evaluator for existing attempts that have no transcript or
 * configured provider yet. New AI-assisted submissions use evaluateSpeaking.
 */
export function calculateBasicSpeakingEvaluation(
  allowedRecordingKeys: Set<string>,
  recordings: SpeakingRecordings
): BasicSpeakingEvaluation {
  const submitted = Object.entries(recordings).filter(
    ([key, recording]) => allowedRecordingKeys.has(key) && recording.durationSeconds > 0
  );
  const recordingCount = submitted.length;
  const totalQuestions = allowedRecordingKeys.size;
  const totalDurationSeconds = submitted.reduce((sum, [, recording]) => sum + recording.durationSeconds, 0);
  const completionRatio = totalQuestions === 0 ? 0 : recordingCount / totalQuestions;
  const averageDuration = recordingCount === 0 ? 0 : totalDurationSeconds / recordingCount;
  const durationFactor = Math.min(1, averageDuration / 30);
  const basicScore = Number(((completionRatio * 0.7 + durationFactor * 0.3) * 100).toFixed(2));
  const estimatedBandScore = Number((Math.round((3 + (basicScore / 100) * 4) * 2) / 2).toFixed(1));
  const completionPercentage = Number((completionRatio * 100).toFixed(2));
  const strengths: string[] = [];
  const improvements: string[] = [];
  if (completionRatio >= 0.8) strengths.push("You recorded answers for most of the required prompts.");
  else improvements.push("Record an answer for more prompts to complete the practice set.");
  if (averageDuration >= 30) strengths.push("Your average response duration supports developed practice answers.");
  else improvements.push("Develop each response for longer before submitting.");

  return {
    recordingCount, totalQuestions, totalDurationSeconds, completionPercentage, basicScore, estimatedBandScore,
    evaluationMode: "BASIC", algorithmVersion: "basic-v1",
    feedback: {
      summary: "This is a practice-completion estimate based on recorded-answer coverage and duration, not an IELTS speaking assessment.",
      strengths, improvements,
    },
  };
}
