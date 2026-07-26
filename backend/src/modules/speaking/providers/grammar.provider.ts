import type { GrammarAnalysis } from "../algorithm/types";
import { GeminiJsonClient } from "./geminiJson.provider";
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

const grammarResponseSchema = {
  type: "OBJECT",
  properties: {
    score: { type: "NUMBER", description: "IELTS grammar band from 0 to 9" },
    errors: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          message: { type: "STRING" },
          category: { type: "STRING" },
          suggestion: { type: "STRING" },
        },
        required: ["message"],
      },
    },
    suggestions: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["score", "errors", "suggestions"],
} as const;

function validGrammarAnalysis(value: unknown): value is GrammarAnalysis {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as GrammarAnalysis).score === "number" &&
      Array.isArray((value as GrammarAnalysis).errors) &&
      Array.isArray((value as GrammarAnalysis).suggestions)
  );
}

/** Gemini returns language-analysis evidence; the deterministic scorer uses it. */
export class GeminiGrammarProvider implements GrammarProvider {
  constructor(private readonly client: GeminiJsonClient) {}

  async analyze(input: GrammarAnalysisRequest): Promise<GrammarAnalysis> {
    const result = await this.client.generate<unknown>(
      [
        "Act as an IELTS grammar analyst. Assess only grammatical range and accuracy; do not calculate an overall IELTS score.",
        "Return an IELTS-equivalent grammar score from 0 to 9, concise learner-facing errors, and practical suggestions.",
        `Transcript:\n${input.transcript}`,
      ].join("\n\n"),
      grammarResponseSchema
    );
    if (!validGrammarAnalysis(result)) throw new SpeakingProviderError("Gemini returned an incomplete grammar analysis.");
    return {
      score: result.score,
      errors: result.errors.slice(0, 20),
      suggestions: result.suggestions.filter((suggestion): suggestion is string => typeof suggestion === "string").slice(0, 10),
    };
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
