import type { RandomTextScorer } from "./interfaces";

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
/** Typical English prose is roughly 38-40% vowels among its letters. */
const IDEAL_VOWEL_RATIO = 0.4;
/** Below this many letters there isn't enough signal to judge; length checks elsewhere handle very short input. */
const MIN_LETTERS_TO_JUDGE = 4;

/**
 * Estimates how likely a piece of text is to be random or meaningless
 * (keyboard mashing, copy-pasted noise, placeholder junk) rather than
 * genuine written or transcribed English. This is a plain statistical
 * heuristic — no dictionaries, no keyword lists, no machine learning — it
 * only looks at letter and character patterns:
 *
 *  - vowel ratio: real English text has a fairly narrow vowel proportion;
 *    gibberish tends to drift far from it in either direction.
 *  - longest consonant run: real English rarely strings together more than
 *    a handful of consonants in one word ("strengths" is an outlier).
 *  - longest repeated-character run: "aaaaaaa" or "!!!!!!!" is a strong
 *    signal of junk input.
 *  - non-alphabetic symbol ratio: text dominated by digits/symbols rather
 *    than letters is unlikely to be a genuine written answer.
 *
 * The four signals are averaged into a single 0..1 score. See this
 * project's Feedback/Validation report for where a trained model could
 * replace this class outright.
 */
export class RandomTextDetector implements RandomTextScorer {
  detect(text: string): number {
    const letters = text.toLowerCase().match(/[a-z]/g) ?? [];
    if (letters.length < MIN_LETTERS_TO_JUDGE) {
      return 0;
    }

    const signals = [
      this.vowelRatioScore(letters),
      this.longestConsonantRunScore(text),
      this.longestRepeatedCharacterRunScore(text),
      this.nonAlphaSymbolRatioScore(text),
    ];

    const average = signals.reduce((sum, value) => sum + value, 0) / signals.length;
    return this.round(Math.min(1, Math.max(0, average)));
  }

  private vowelRatioScore(letters: string[]): number {
    const vowelCount = letters.filter((letter) => VOWELS.has(letter)).length;
    const ratio = vowelCount / letters.length;
    return Math.min(1, Math.abs(ratio - IDEAL_VOWEL_RATIO) / IDEAL_VOWEL_RATIO);
  }

  private longestConsonantRunScore(text: string): number {
    const runs = text.toLowerCase().match(/[b-df-hj-np-tv-z]+/g) ?? [];
    const longest = runs.reduce((max, run) => Math.max(max, run.length), 0);
    return Math.min(1, longest / 8);
  }

  private longestRepeatedCharacterRunScore(text: string): number {
    const runs = text.match(/(.)\1{2,}/g) ?? [];
    const longest = runs.reduce((max, run) => Math.max(max, run.length), 0);
    return Math.min(1, longest / 10);
  }

  private nonAlphaSymbolRatioScore(text: string): number {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return 0;
    }

    const nonAlphaCount = (trimmed.match(/[^a-zA-Z\s.,!?'"-]/g) ?? []).length;
    return Math.min(1, nonAlphaCount / trimmed.length);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
