import type { FeedbackResult } from "./types";

/**
 * Assembles a FeedbackResult one fragment at a time. This class has exactly
 * one responsibility: collecting strengths/weaknesses/recommendations and
 * the score comment/summary strings, then producing the final result
 * object. It knows nothing about datasets, templates, condition matching,
 * or evaluation scores — it only holds strings it is handed.
 *
 * Methods return `this` so calls can be chained, e.g.:
 *   new FeedbackBuilder().addStrength(a).addWeakness(b).build()
 */
export class FeedbackBuilder {
  private readonly strengths: string[] = [];
  private readonly weaknesses: string[] = [];
  private readonly recommendations: string[] = [];
  private scoreComment = "";
  private summary = "";

  addStrength(text: string): this {
    this.pushIfNotBlank(this.strengths, text);
    return this;
  }

  addWeakness(text: string): this {
    this.pushIfNotBlank(this.weaknesses, text);
    return this;
  }

  addRecommendation(text: string): this {
    this.pushIfNotBlank(this.recommendations, text);
    return this;
  }

  setScoreComment(text: string): this {
    this.scoreComment = text.trim();
    return this;
  }

  setSummary(text: string): this {
    this.summary = text.trim();
    return this;
  }

  build(): FeedbackResult {
    return {
      strengths: [...this.strengths],
      weaknesses: [...this.weaknesses],
      recommendations: [...this.recommendations],
      scoreComment: this.scoreComment,
      summary: this.summary,
    };
  }

  private pushIfNotBlank(target: string[], text: string): void {
    const trimmed = text.trim();
    if (trimmed.length > 0) {
      target.push(trimmed);
    }
  }
}
