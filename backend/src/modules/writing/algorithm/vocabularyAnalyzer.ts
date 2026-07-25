import { extractWords } from "./wordCounter";
import type { RepeatedWord, WritingVocabularyDataset } from "./types";

const DEFAULT_STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have", "i", "in",
  "is", "it", "of", "on", "or", "that", "the", "this", "to", "was", "were", "with", "will", "would",
]);

export interface VocabularyAnalysis {
  totalWords: number;
  contentWords: string[];
  uniqueWords: number;
  repeatedWords: RepeatedWord[];
  vocabularyDiversity: number;
  lexicalRichness: number;
  academicWordCount: number;
}

function isAcademicWord(word: string, dataset?: WritingVocabularyDataset): boolean {
  if (dataset?.isAcademicWord) return dataset.isAcademicWord(word);
  if (dataset?.academicWords) return dataset.academicWords.has(word);
  // Conservative local fallback until a writing vocabulary JSON dataset is installed.
  return word.length >= 9;
}

export function analyzeVocabulary(text: string, dataset?: WritingVocabularyDataset): VocabularyAnalysis {
  const words = extractWords(text);
  const stopWords = dataset?.stopWords ?? DEFAULT_STOP_WORDS;
  const contentWords = words.filter((word) => !stopWords.has(word));
  const counts = new Map<string, number>();
  for (const word of contentWords) counts.set(word, (counts.get(word) ?? 0) + 1);

  const uniqueWords = new Set(contentWords).size;
  const repeatedWords = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));
  const onceUsed = [...counts.values()].filter((count) => count === 1).length;

  return {
    totalWords: words.length,
    contentWords,
    uniqueWords,
    repeatedWords,
    vocabularyDiversity: contentWords.length === 0 ? 0 : Number((uniqueWords / contentWords.length).toFixed(3)),
    lexicalRichness: contentWords.length === 0 ? 0 : Number((onceUsed / contentWords.length).toFixed(3)),
    academicWordCount: contentWords.filter((word) => isAcademicWord(word, dataset)).length,
  };
}
