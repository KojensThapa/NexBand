import type { FillerWordAnalysis, FluencyMetrics, GrammarAnalysis, PronunciationAnalysis, VocabularyMetrics } from "./types";

export interface FeedbackInput {
  fluency: FluencyMetrics;
  vocabulary: VocabularyMetrics;
  grammar: GrammarAnalysis;
  pronunciation: PronunciationAnalysis;
  fillerWords: FillerWordAnalysis;
}

export interface SpeakingFeedback {
  strengths: string[];
  weakAreas: string[];
}

export function generateFeedback(input: FeedbackInput): SpeakingFeedback {
  const strengths: string[] = [];
  const weakAreas: string[] = [];

  if (input.fluency.speakingPace === "NORMAL") strengths.push("Natural speaking pace.");
  if (input.fluency.score >= 6.5) strengths.push("Responses are developed with useful sentence length.");
  if (input.vocabulary.score >= 6.5) strengths.push("Good vocabulary range.");
  if (input.grammar.score >= 6.5) strengths.push("Good grammatical accuracy.");
  if (input.pronunciation.score >= 6.5) strengths.push("Clear pronunciation.");

  if (input.fluency.speakingPace === "TOO_SLOW") weakAreas.push("Speaking pace is too slow.");
  if (input.fluency.speakingPace === "TOO_FAST") weakAreas.push("Speaking pace is too fast.");
  if (input.fillerWords.count >= 3) weakAreas.push("Too many filler words.");
  if (input.vocabulary.repeatedWords.length >= 3 || input.vocabulary.score < 5.5) {
    weakAreas.push("Vocabulary is repetitive or limited.");
  }
  if (input.grammar.errors.length > 0 || input.grammar.score < 5.5) weakAreas.push("Grammar mistakes affect accuracy.");
  if (input.pronunciation.score < 5.5) weakAreas.push("Pronunciation needs more clarity.");

  return { strengths, weakAreas };
}

