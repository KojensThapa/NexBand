import type { WritingFeedbackInput } from "./feedbackGenerator";

/** Deterministic rules; replace or enrich these with a JSON dataset later. */
export function generateRecommendations(input: WritingFeedbackInput, weakAreas: readonly string[]): string[] {
  const recommendations: string[] = [];
  if (weakAreas.includes("Low word count.")) {
    recommendations.push(`Write at least ${input.wordCount.minimumWordCount} words before submitting.`);
  }
  if (weakAreas.includes("Weak overview.")) recommendations.push("Improve the overview sentence by summarising the main trends.");
  if (weakAreas.includes("Missing conclusion.")) recommendations.push("Add a concise conclusion that clearly answers the question.");
  if (weakAreas.includes("Repeated vocabulary.")) {
    recommendations.push("Use more academic vocabulary and reduce repeated words.");
  }
  if (weakAreas.includes("Poor transitions between ideas.")) {
    recommendations.push("Improve paragraph transitions with precise linking words.");
  }
  if (weakAreas.includes("Grammar mistakes affect accuracy.")) {
    recommendations.push("Review grammar suggestions and practise complex sentence structures.");
  }
  return recommendations.length > 0
    ? recommendations
    : ["Maintain your structure and practise writing about a wider range of IELTS topics."];
}

