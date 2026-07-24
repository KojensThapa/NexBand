import type { PronunciationAnalysis } from "../algorithm/types";
import type { AudioReference } from "./speechToText.provider";
import { SpeakingProviderError } from "./speechToText.provider";

export interface PronunciationAnalysisRequest {
  audio: AudioReference;
  transcript: string;
  language?: string;
  correlationId?: string;
}

export interface PronunciationProvider {
  analyze(input: PronunciationAnalysisRequest): Promise<PronunciationAnalysis>;
}

export class UnconfiguredPronunciationProvider implements PronunciationProvider {
  async analyze(): Promise<PronunciationAnalysis> {
    throw new SpeakingProviderError("Pronunciation analysis is not configured.");
  }
}

export interface HttpPronunciationProviderOptions {
  endpoint: string;
  apiKey?: string;
  fetchImplementation?: typeof fetch;
}

export class HttpPronunciationProvider implements PronunciationProvider {
  private readonly fetchImplementation: typeof fetch;

  constructor(private readonly options: HttpPronunciationProviderOptions) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  async analyze(input: PronunciationAnalysisRequest): Promise<PronunciationAnalysis> {
    const response = await this.fetchImplementation(this.options.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.options.apiKey ? { authorization: `Bearer ${this.options.apiKey}` } : {}),
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new SpeakingProviderError("Pronunciation provider request failed.");
    const body: unknown = await response.json();
    if (!body || typeof body !== "object") throw new SpeakingProviderError("Pronunciation provider returned an invalid result.");
    const result = body as Partial<PronunciationAnalysis>;
    if (
      typeof result.score !== "number" ||
      typeof result.confidenceScore !== "number" ||
      !Array.isArray(result.mispronouncedWords) ||
      typeof result.supported !== "boolean"
    ) {
      throw new SpeakingProviderError("Pronunciation provider returned an incomplete result.");
    }
    return {
      score: result.score,
      confidenceScore: result.confidenceScore,
      mispronouncedWords: result.mispronouncedWords,
      supported: result.supported,
    };
  }
}

