import type { GrammarAnalysis } from "../algorithm/types";
import { SpeakingProviderError } from "./speechToText.provider";

export interface GrammarAnalysisRequest {
  transcript: string;
  language?: string;
  correlationId?: string;
}

export interface GrammarProvider {
  analyze(input: GrammarAnalysisRequest): Promise<GrammarAnalysis>;
}

export class UnconfiguredGrammarProvider implements GrammarProvider {
  async analyze(): Promise<GrammarAnalysis> {
    throw new SpeakingProviderError("Grammar analysis is not configured.");
  }
}

export interface HttpGrammarProviderOptions {
  endpoint: string;
  apiKey?: string;
  fetchImplementation?: typeof fetch;
}

/** Generic JSON adapter; convert a vendor payload to this contract here. */
export class HttpGrammarProvider implements GrammarProvider {
  private readonly fetchImplementation: typeof fetch;

  constructor(private readonly options: HttpGrammarProviderOptions) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  async analyze(input: GrammarAnalysisRequest): Promise<GrammarAnalysis> {
    const response = await this.fetchImplementation(this.options.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.options.apiKey ? { authorization: `Bearer ${this.options.apiKey}` } : {}),
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new SpeakingProviderError("Grammar provider request failed.");
    const body: unknown = await response.json();
    if (!body || typeof body !== "object") throw new SpeakingProviderError("Grammar provider returned an invalid result.");
    const result = body as Partial<GrammarAnalysis>;
    if (typeof result.score !== "number" || !Array.isArray(result.errors) || !Array.isArray(result.suggestions)) {
      throw new SpeakingProviderError("Grammar provider returned an incomplete result.");
    }
    return { score: result.score, errors: result.errors, suggestions: result.suggestions };
  }
}

