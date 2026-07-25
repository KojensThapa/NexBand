import type { EssayAnalysis } from "../algorithm/types";
import {
  WritingProviderError,
  type EssayAnalysisProvider,
  type EssayProviderRequest,
} from "./provider.interface";

export class UnconfiguredEssayAnalysisProvider implements EssayAnalysisProvider {
  async analyze(): Promise<EssayAnalysis> {
    throw new WritingProviderError("Writing essay analysis is not configured.", 503);
  }
}

export interface HttpEssayAnalysisProviderOptions {
  endpoint: string;
  apiKey?: string;
  fetchImplementation?: typeof fetch;
}

/** Generic JSON adapter for any configured essay-analysis provider. */
export class HttpEssayAnalysisProvider implements EssayAnalysisProvider {
  private readonly fetchImplementation: typeof fetch;

  constructor(private readonly options: HttpEssayAnalysisProviderOptions) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  async analyze(input: EssayProviderRequest): Promise<EssayAnalysis> {
    const response = await this.fetchImplementation(this.options.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.options.apiKey ? { authorization: `Bearer ${this.options.apiKey}` } : {}),
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new WritingProviderError("Essay analysis provider request failed.");
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object") {
      throw new WritingProviderError("Essay analysis provider returned an invalid result.");
    }
    const result = payload as EssayAnalysis;
    for (const score of [result.taskAchievementScore, result.coherenceScore, result.vocabularyScore, result.estimatedBand]) {
      if (score !== undefined && typeof score !== "number") {
        throw new WritingProviderError("Essay analysis provider returned an invalid score.");
      }
    }
    if (result.summary !== undefined && typeof result.summary !== "string") {
      throw new WritingProviderError("Essay analysis provider returned an invalid summary.");
    }
    if (result.keywordCoverage !== undefined && typeof result.keywordCoverage !== "number") {
      throw new WritingProviderError("Essay analysis provider returned invalid keyword coverage.");
    }
    return result;
  }
}

