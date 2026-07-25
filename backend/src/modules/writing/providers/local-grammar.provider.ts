import type { GrammarResult, WritingIssue } from "../algorithm/types";
import type { GrammarProvider, GrammarProviderRequest } from "./provider.interface";

/**
 * Common misspellings frequently seen in IELTS writing responses. Deliberately
 * small — this is a heuristic fallback, not a full spellchecker.
 */
const COMMON_MISSPELLINGS: Record<string, string> = {
  recieve: "receive",
  seperate: "separate",
  definately: "definitely",
  goverment: "government",
  enviroment: "environment",
  occured: "occurred",
  untill: "until",
  wich: "which",
  becuase: "because",
  beleive: "believe",
  arguement: "argument",
  neccessary: "necessary",
  acheive: "achieve",
  begining: "beginning",
  concious: "conscious",
  existance: "existence",
  independant: "independent",
  publically: "publicly",
  reccommend: "recommend",
  tommorow: "tomorrow",
};

function splitSentences(essay: string): string[] {
  return essay
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function findRunOnSentences(sentences: string[]): WritingIssue[] {
  return sentences
    .filter((sentence) => sentence.split(/\s+/).length > 40)
    .map((sentence) => ({
      message: "This sentence is very long and may be easier to read as two sentences.",
      category: "run-on",
      suggestion: sentence.slice(0, 60) + "…",
    }));
}

function findCapitalizationIssues(sentences: string[]): WritingIssue[] {
  return sentences
    .filter((sentence) => /^[a-z]/.test(sentence))
    .map((sentence) => ({
      message: "A sentence should start with a capital letter.",
      category: "capitalization",
      suggestion: sentence.slice(0, 40),
    }));
}

function findRepeatedWords(essay: string): WritingIssue[] {
  const matches = essay.match(/\b(\w+)\s+\1\b/gi) ?? [];
  return matches.map((match) => ({
    message: `The word is repeated back-to-back: "${match}".`,
    category: "repetition",
    suggestion: match.split(/\s+/)[0],
  }));
}

function findDoubleSpacing(essay: string): WritingIssue[] {
  const matches = essay.match(/\S {2,}\S/g) ?? [];
  return matches.slice(0, 5).map(() => ({
    message: "Extra spacing found between words.",
    category: "punctuation",
  }));
}

function findMisspellings(essay: string): WritingIssue[] {
  const words = essay.match(/[A-Za-z']+/g) ?? [];
  const issues: WritingIssue[] = [];
  const seen = new Set<string>();

  for (const word of words) {
    const lower = word.toLowerCase();
    const correction = COMMON_MISSPELLINGS[lower];
    if (correction && !seen.has(lower)) {
      seen.add(lower);
      issues.push({
        message: `"${word}" may be misspelled.`,
        category: "spelling",
        suggestion: correction,
      });
    }
  }

  return issues;
}

/**
 * Deterministic, offline grammar heuristic used when no external grammar
 * provider (SPEAKING/WRITING_GRAMMAR_ENDPOINT) is configured. Mirrors the
 * shape of a real provider so the algorithm layer is unaffected.
 */
export class LocalGrammarProvider implements GrammarProvider {
  async analyze(input: GrammarProviderRequest): Promise<GrammarResult> {
    const essay = input.essay.trim();
    const sentences = splitSentences(essay);

    const grammarErrors = [
      ...findRunOnSentences(sentences),
      ...findCapitalizationIssues(sentences),
      ...findRepeatedWords(essay),
    ].slice(0, 20);
    const spellingErrors = findMisspellings(essay).slice(0, 20);
    const punctuationErrors = findDoubleSpacing(essay).slice(0, 10);

    const totalIssues = grammarErrors.length + spellingErrors.length + punctuationErrors.length;
    const wordCount = essay ? essay.split(/\s+/).length : 0;
    const issueDensity = wordCount === 0 ? 1 : totalIssues / Math.max(1, wordCount / 50);
    const score = Number(Math.max(3, Math.min(9, 8.5 - issueDensity * 1.1)).toFixed(2));

    const suggestions = [
      ...new Set(
        [...grammarErrors, ...spellingErrors, ...punctuationErrors]
          .map((issue) => issue.suggestion)
          .filter((suggestion): suggestion is string => Boolean(suggestion))
      ),
    ].slice(0, 10);

    return { score, grammarErrors, spellingErrors, punctuationErrors, suggestions };
  }
}
