import type { GrammarResult, WritingIssue } from "../algorithm/types";
import {
  WritingProviderError,
  type GrammarProvider,
  type GrammarProviderRequest,
} from "./provider.interface";

export class UnconfiguredGrammarProvider implements GrammarProvider {
  async analyze(): Promise<GrammarResult> {
    throw new WritingProviderError("Writing grammar analysis is not configured.", 503);
  }
}

export interface HttpGrammarProviderOptions {
  endpoint: string;
  apiKey?: string;
  fetchImplementation?: typeof fetch;
}

function isIssue(value: unknown): value is WritingIssue {
  return Boolean(value) && typeof value === "object" && typeof (value as { message?: unknown }).message === "string";
}

/** Generic JSON adapter. Map a vendor's grammar payload at this boundary. */
export class HttpGrammarProvider implements GrammarProvider {
  private readonly fetchImplementation: typeof fetch;

  constructor(private readonly options: HttpGrammarProviderOptions) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  async analyze(input: GrammarProviderRequest): Promise<GrammarResult> {
    const response = await this.fetchImplementation(this.options.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.options.apiKey ? { authorization: `Bearer ${this.options.apiKey}` } : {}),
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new WritingProviderError("Grammar provider request failed.");
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object") {
      throw new WritingProviderError("Grammar provider returned an invalid result.");
    }
    const result = payload as Partial<GrammarResult>;
    if (
      typeof result.score !== "number" ||
      !Array.isArray(result.grammarErrors) ||
      !Array.isArray(result.spellingErrors) ||
      !Array.isArray(result.punctuationErrors) ||
      !Array.isArray(result.suggestions) ||
      !result.grammarErrors.every(isIssue) ||
      !result.spellingErrors.every(isIssue) ||
      !result.punctuationErrors.every(isIssue) ||
      !result.suggestions.every((suggestion) => typeof suggestion === "string")
    ) {
      throw new WritingProviderError("Grammar provider returned an incomplete result.");
    }
    return {
      score: result.score,
      grammarErrors: result.grammarErrors,
      spellingErrors: result.spellingErrors,
      punctuationErrors: result.punctuationErrors,
      suggestions: result.suggestions,
    };
  }
}

