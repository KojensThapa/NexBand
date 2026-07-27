import { analyzeVocabulary } from "./vocabularyAnalyzer";
import type { EssayAnalysis, VocabularyMetrics, WritingVocabularyDataset } from "./types";

function toBandScore(score: number | undefined): number | undefined {
  if (score === undefined || !Number.isFinite(score)) return undefined;
  return Math.max(0, Math.min(9, score > 9 ? (score / 100) * 9 : score));
}

function localVocabularyScore(metrics: ReturnType<typeof analyzeVocabulary>): number {
  if (metrics.totalWords === 0) return 0;
  const academicDensity = metrics.contentWords.length === 0
    ? 0
    : metrics.academicWordCount / metrics.contentWords.length;
  const repeatedInstances = metrics.repeatedWords.reduce((total, word) => total + word.count - 1, 0);
  const repetitionPenalty = Math.min(1.5, (repeatedInstances / Math.max(1, metrics.contentWords.length)) * 4);
  const raw = 2.5 + metrics.vocabularyDiversity * 3.25 + metrics.lexicalRichness * 1.75 + Math.min(1, academicDensity * 10) * 1.5;
  return Math.max(0, Math.min(9, raw - repetitionPenalty));
}

/** Blends provider vocabulary insight with deterministic lexical metrics. */
export function calculateVocabulary(
  essay: string,
  essayAnalysis: EssayAnalysis,
  dataset?: WritingVocabularyDataset
): VocabularyMetrics {
  const analysis = analyzeVocabulary(essay, dataset);
  const localScore = localVocabularyScore(analysis);
  const providerScore = toBandScore(essayAnalysis.vocabularyScore);
  // Required weighting: 70% Gemini lexical analysis, 30% local lexical metrics.
  const score = providerScore === undefined
    ? localScore
    : localScore * 0.3 + providerScore * 0.7;

  return {
    uniqueWords: analysis.uniqueWords,
    repeatedWords: analysis.repeatedWords,
    vocabularyDiversity: analysis.vocabularyDiversity,
    lexicalRichness: analysis.lexicalRichness,
    academicWordCount: analysis.academicWordCount,
    score: Number(Math.max(0, Math.min(9, score)).toFixed(2)),
  };
}
