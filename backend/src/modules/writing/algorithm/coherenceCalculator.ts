import type { CoherenceMetrics, EssayAnalysis, WritingTaskNumber } from "./types";

const TRANSITIONS = [
  "however", "therefore", "moreover", "furthermore", "consequently", "nevertheless", "meanwhile",
  "firstly", "secondly", "finally", "for example", "for instance", "in contrast", "as a result",
];
const LINKING_WORDS = ["although", "because", "while", "whereas", "despite", "in addition", "on the other hand"];

function countOccurrences(text: string, phrases: readonly string[]): number {
  return phrases.reduce((total, phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return total + (text.match(new RegExp(`\\b${escaped}\\b`, "gi"))?.length ?? 0);
  }, 0);
}

function sentenceCount(essay: string): number {
  return essay.split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean).length;
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function toBand(score: number | undefined): number | undefined {
  if (score === undefined || !Number.isFinite(score)) return undefined;
  return Math.max(0, Math.min(9, score > 9 ? (score / 100) * 9 : score));
}

export function calculateCoherence(
  essay: string,
  taskNumber: WritingTaskNumber,
  essayAnalysis: EssayAnalysis
): CoherenceMetrics {
  const paragraphs = essay.trim().split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const words = wordCount(essay);
  const sentences = sentenceCount(essay);
  const transitionWordCount = countOccurrences(essay, TRANSITIONS);
  const linkingWordCount = countOccurrences(essay, LINKING_WORDS);
  const desiredParagraphs = taskNumber === 1 ? 2 : 4;
  const paragraphFactor = Math.min(1, paragraphs.length / desiredParagraphs);
  const transitionFactor = Math.min(1, (transitionWordCount + linkingWordCount) / Math.max(2, paragraphs.length));
  const averageSentenceLength = sentences === 0 ? 0 : words / sentences;
  const sentenceFactor = averageSentenceLength >= 10 && averageSentenceLength <= 30 ? 1 : averageSentenceLength >= 6 ? 0.65 : 0.3;
  const localScore = 3.5 + paragraphFactor * 2.2 + transitionFactor * 1.7 + sentenceFactor * 1.6;
  const providerScore = toBand(essayAnalysis.coherenceScore);
  // Required weighting: 70% Gemini coherence analysis, 30% local structure metrics.
  const score = providerScore === undefined ? localScore : localScore * 0.3 + providerScore * 0.7;

  return {
    sentenceCount: sentences,
    paragraphCount: paragraphs.length,
    averageParagraphLength: paragraphs.length === 0 ? 0 : Number((words / paragraphs.length).toFixed(2)),
    transitionWordCount,
    linkingWordCount,
    averageSentenceLength: Number(averageSentenceLength.toFixed(2)),
    score: Number(Math.max(0, Math.min(9, score)).toFixed(2)),
  };
}
