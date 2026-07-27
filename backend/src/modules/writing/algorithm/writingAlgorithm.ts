import { calculateCefrLevel, calculateOverallBand } from "./bandCalculator";
import { calculateCoherence } from "./coherenceCalculator";
import { generateFeedback } from "./feedbackGenerator";
import { calculateGrammarScore } from "./grammarCalculator";
import { generateRecommendations } from "./recommendationEngine";
import { calculateTaskAchievement } from "./taskAchievement";
import type { WritingEvaluationInput, WritingEvaluationResult } from "./types";
import { calculateVocabulary } from "./vocabularyCalculator";
import { calculateWordCount } from "./wordCounter";

/**
 * Pure Writing business logic. Provider results are supplied by the service;
 * this function never imports Fastify, Prisma, a repository, or an AI SDK.
 */
export function evaluateWriting(input: WritingEvaluationInput): WritingEvaluationResult {
  const essay = input.essay.trim();
  const wordCountMetrics = calculateWordCount(essay, input.taskNumber);
  const vocabulary = calculateVocabulary(essay, input.essayAnalysis, input.vocabularyDataset);
  const grammarScore = calculateGrammarScore(input.grammarResult);
  const taskAchievement = calculateTaskAchievement(
    essay,
    input.taskNumber,
    input.essayAnalysis,
    input.questionMetadata
  );
  const coherence = calculateCoherence(essay, input.taskNumber, input.essayAnalysis);
  const unpenalizedBand = calculateOverallBand({
    taskAchievement: taskAchievement.score,
    coherence: coherence.score,
    vocabulary: vocabulary.score,
    grammar: grammarScore,
  });
  const overallBand = Math.max(0, Number((unpenalizedBand - wordCountMetrics.wordCountPenalty).toFixed(1)));
  const feedbackInput = {
    taskNumber: input.taskNumber,
    wordCount: wordCountMetrics,
    vocabulary,
    grammar: input.grammarResult,
    grammarScore,
    taskAchievement,
    coherence,
  };
  const feedback = generateFeedback(feedbackInput);
  const completedTasks = new Set(input.completedTaskNumbers ?? [input.taskNumber]);
  const recommendations = generateRecommendations(feedbackInput, feedback.weakAreas);

  return {
    status: completedTasks.has(1) && completedTasks.has(2) ? "Completed" : "Incomplete",
    taskNumber: input.taskNumber,
    question: input.questionMetadata.prompt ?? "",
    studentEssay: essay,
    wordCount: wordCountMetrics.wordCount,
    uniqueWords: vocabulary.uniqueWords,
    repeatedWords: vocabulary.repeatedWords,
    grammarErrors: input.grammarResult.grammarErrors,
    spellingErrors: input.grammarResult.spellingErrors,
    punctuationErrors: input.grammarResult.punctuationErrors,
    taskAchievementScore: taskAchievement.score,
    coherenceScore: coherence.score,
    vocabularyScore: vocabulary.score,
    grammarScore,
    overallBand,
    cefrLevel: calculateCefrLevel(overallBand),
    strengths: [...new Set([...feedback.strengths, ...(input.essayAnalysis.strengths ?? [])])],
    weakAreas: [...new Set([...feedback.weakAreas, ...(input.essayAnalysis.weakAreas ?? [])])],
    recommendations: [...new Set([...recommendations, ...(input.essayAnalysis.recommendations ?? [])])],
    wordCountMetrics,
    vocabulary,
    taskAchievement,
    coherence,
    grammarSuggestions: input.grammarResult.suggestions,
    questionRelevance: {
      answeredQuestion: taskAchievement.answeredQuestion,
      coveredAllParts: taskAchievement.coveredAllParts,
      offTopic: taskAchievement.offTopic,
      relevanceScore: taskAchievement.relevanceScore,
      missingPoints: taskAchievement.missingPoints,
    },
    ...(input.essayAnalysis.summary ? { essaySummary: input.essayAnalysis.summary } : {}),
    providerUsed: input.providerUsed ?? "Local Fallback",
    evaluationTimeMs: Math.max(0, input.evaluationTimeMs ?? 0),
    ...(input.evaluatedAt ? { evaluatedAt: input.evaluatedAt } : {}),
    algorithmVersion: "writing-v1",
  };
}
