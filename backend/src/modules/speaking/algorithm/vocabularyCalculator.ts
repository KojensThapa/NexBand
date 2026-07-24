import { tokenizeTranscript } from "./fluencyCalculator";
import type { RepeatedWord, VocabularyDataset, VocabularyMetrics } from "./types";

const DEFAULT_STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "have", "i", "in", "is", "it",
  "of", "on", "or", "that", "the", "this", "to", "was", "were", "with", "you", "your",
]);

function isAdvancedWord(word: string, dataset?: VocabularyDataset): boolean {
  if (dataset?.isAdvancedWord) return dataset.isAdvancedWord(word);
  if (dataset?.advancedWords) return dataset.advancedWords.has(word);
  // Conservative fallback until an IELTS vocabulary dataset is installed.
  return word.length >= 9;
}

function toBandScore(diversity: number, richness: number, advancedDensity: number, totalWords: number): number {
  if (totalWords === 0) return 0;
  const sampleFactor = Math.min(1, totalWords / 60);
  const raw = 2.5 + diversity * 3.5 + richness * 1.5 + Math.min(1, advancedDensity * 12) * 1.5;
  return Math.max(0, Math.min(9, Number((raw * (0.65 + sampleFactor * 0.35)).toFixed(2))));
}

export function calculateVocabulary(
  transcript: string,
  dataset?: VocabularyDataset
): VocabularyMetrics {
  const words = tokenizeTranscript(transcript);
  const stopWords = dataset?.stopWords ?? DEFAULT_STOP_WORDS;
  const contentWords = words.filter((word) => !stopWords.has(word));
  const frequency = new Map<string, number>();
  for (const word of contentWords) frequency.set(word, (frequency.get(word) ?? 0) + 1);

  const uniqueWords = new Set(contentWords);
  const vocabularyDiversity = contentWords.length === 0 ? 0 : uniqueWords.size / contentWords.length;
  const onceUsedWords = [...frequency.values()].filter((count) => count === 1).length;
  const lexicalRichness = contentWords.length === 0 ? 0 : onceUsedWords / contentWords.length;
  const advancedWordCount = contentWords.filter((word) => isAdvancedWord(word, dataset)).length;
  const repeatedWords: RepeatedWord[] = [...frequency.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return {
    totalWords: words.length,
    uniqueWords: uniqueWords.size,
    vocabularyDiversity: Number(vocabularyDiversity.toFixed(3)),
    lexicalRichness: Number(lexicalRichness.toFixed(3)),
    advancedWordCount,
    repeatedWords,
    score: toBandScore(
      vocabularyDiversity,
      lexicalRichness,
      contentWords.length === 0 ? 0 : advancedWordCount / contentWords.length,
      words.length
    ),
  };
}

