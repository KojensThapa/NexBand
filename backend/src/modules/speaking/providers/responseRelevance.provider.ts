import type { ResponseRelevanceAnalysis } from "../algorithm/types";
import { GeminiJsonClient } from "./geminiJson.provider";
import { SpeakingProviderError } from "./speechToText.provider";

export interface ResponseRelevanceRequest {
  question: string;
  transcript: string;
  correlationId?: string;
}

export interface ResponseRelevanceProvider {
  analyze(input: ResponseRelevanceRequest): Promise<ResponseRelevanceAnalysis>;
}

const responseRelevanceSchema = {
  type: "OBJECT",
  properties: {
    score: { type: "NUMBER", description: "Question relevance score from 0 to 9" },
    answeredQuestion: { type: "BOOLEAN" },
    relevance: { type: "STRING", enum: ["HIGH", "MEDIUM", "LOW"] },
    reason: { type: "STRING" },
    missingPoints: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["score", "answeredQuestion", "relevance", "reason", "missingPoints"],
} as const;

function validAnalysis(value: unknown): value is ResponseRelevanceAnalysis {
  const candidate = value as ResponseRelevanceAnalysis | undefined;
  return Boolean(
    candidate &&
      typeof candidate.score === "number" &&
      typeof candidate.answeredQuestion === "boolean" &&
      ["HIGH", "MEDIUM", "LOW"].includes(candidate.relevance) &&
      typeof candidate.reason === "string" &&
      Array.isArray(candidate.missingPoints)
  );
}

/** Dedicated Gemini provider for question-answer relevance. */
export class GeminiResponseRelevanceProvider implements ResponseRelevanceProvider {
  constructor(private readonly client: GeminiJsonClient) {}

  async analyze(input: ResponseRelevanceRequest): Promise<ResponseRelevanceAnalysis> {
    if (!input.question.trim()) {
      return {
        score: 6,
        answeredQuestion: true,
        relevance: "MEDIUM",
        reason: "No examiner question was supplied for relevance analysis.",
        missingPoints: [],
      };
    }

    const result = await this.client.generate<unknown>(
      [
        "Evaluate whether an IELTS candidate answered the examiner's actual question.",
        "Do not judge grammar, fluency, vocabulary, or pronunciation. An unrelated but fluent answer must receive LOW relevance and a low score.",
        `Question:\n${input.question}`,
        `Candidate transcript:\n${input.transcript}`,
      ].join("\n\n"),
      responseRelevanceSchema
    );
    if (!validAnalysis(result)) throw new SpeakingProviderError("Gemini returned an incomplete response relevance analysis.");
    return {
      ...result,
      score: Math.max(0, Math.min(9, result.score)),
      missingPoints: result.missingPoints.filter((point): point is string => typeof point === "string").slice(0, 10),
    };
  }
}

/** Neutral fallback ensures a provider outage never invents a relevance penalty. */
export class NeutralResponseRelevanceProvider implements ResponseRelevanceProvider {
  async analyze(): Promise<ResponseRelevanceAnalysis> {
    return {
      score: 6,
      answeredQuestion: true,
      relevance: "MEDIUM",
      reason: "Response relevance AI analysis was unavailable, so no relevance penalty was applied.",
      missingPoints: [],
    };
  }
}
