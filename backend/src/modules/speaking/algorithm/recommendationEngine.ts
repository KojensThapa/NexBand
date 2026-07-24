import type { SpeakingPartNumber } from "./types";
import type { FeedbackInput } from "./feedbackGenerator";

export function generateRecommendations(input: FeedbackInput, partNumber: SpeakingPartNumber): string[] {
  const recommendations: string[] = [];
  if (input.fluency.speakingPace === "TOO_SLOW") {
    recommendations.push("Practice speaking for two minutes without stopping to build a steadier pace.");
  }
  if (input.fluency.speakingPace === "TOO_FAST") {
    recommendations.push("Slow down slightly and pause at sentence boundaries so your ideas are clearer.");
  }
  if (input.fillerWords.count >= 3) recommendations.push("Reduce filler words by replacing them with short silent pauses.");
  if (input.vocabulary.score < 6) recommendations.push("Use more precise topic vocabulary and linking words instead of repeating the same terms.");
  if (input.grammar.errors.length > 0 || input.grammar.score < 6) {
    recommendations.push("Review the grammar suggestions and practise the same sentence patterns aloud.");
  }
  if (input.pronunciation.score < 6) {
    recommendations.push("Shadow short model answers and focus on stress in multi-syllable words.");
  }
  if (partNumber === 3) recommendations.push("Expand Part 3 answers with a reason, an example, and a contrasting idea.");
  if (partNumber === 2) recommendations.push("Structure the long turn with an opening, two or three details, and a concise closing.");

  return recommendations.length > 0
    ? recommendations
    : ["Keep practising with varied topics to maintain your current speaking performance."];
}

