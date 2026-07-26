import type { PronunciationAnalysis } from "../algorithm/types";
import type { LocalUploadAudioResolver } from "./audioSource.provider";
import { GeminiJsonClient } from "./geminiJson.provider";
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

const pronunciationResponseSchema = {
  type: "OBJECT",
  properties: {
    score: { type: "NUMBER", description: "IELTS-equivalent pronunciation evidence score from 0 to 9" },
    confidenceScore: { type: "NUMBER", description: "Confidence from 0 to 1" },
    mispronouncedWords: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          word: { type: "STRING" },
          suggestedPronunciation: { type: "STRING" },
          confidence: { type: "NUMBER" },
        },
        required: ["word"],
      },
    },
  },
  required: ["score", "confidenceScore", "mispronouncedWords"],
} as const;

function validPronunciationAnalysis(value: unknown): value is Omit<PronunciationAnalysis, "supported"> {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as PronunciationAnalysis).score === "number" &&
      typeof (value as PronunciationAnalysis).confidenceScore === "number" &&
      Array.isArray((value as PronunciationAnalysis).mispronouncedWords)
  );
}

/** Gemini provides optional audio-assisted pronunciation feedback, never the final band. */
export class GeminiPronunciationProvider implements PronunciationProvider {
  constructor(
    private readonly client: GeminiJsonClient,
    private readonly localUploadAudioResolver: LocalUploadAudioResolver
  ) {}

  async analyze(input: PronunciationAnalysisRequest): Promise<PronunciationAnalysis> {
    let audio;
    try {
      audio = await this.localUploadAudioResolver(input.audio);
    } catch (error) {
      if (error instanceof SpeakingProviderError && error.statusCode === 422) {
        return { score: 5, confidenceScore: 0, mispronouncedWords: [], supported: false };
      }
      throw error;
    }

    const result = await this.client.generateFromParts<unknown>(
      [
        {
          inlineData: {
            mimeType: audio.mimeType,
            data: Buffer.from(audio.bytes).toString("base64"),
          },
        },
        {
          text: [
            "Act as an IELTS pronunciation feedback assistant. Listen to the supplied audio and use the transcript only as context.",
            "Return pronunciation evidence, not an overall IELTS band. Flag only clearly supported mispronunciations.",
            `Transcript:\n${input.transcript}`,
          ].join("\n\n"),
        },
      ],
      pronunciationResponseSchema
    );
    if (!validPronunciationAnalysis(result)) {
      throw new SpeakingProviderError("Gemini returned an incomplete pronunciation analysis.");
    }
    return {
      score: result.score,
      confidenceScore: Math.max(0, Math.min(1, result.confidenceScore)),
      mispronouncedWords: result.mispronouncedWords
        .filter((word): word is PronunciationAnalysis["mispronouncedWords"][number] =>
          Boolean(word && typeof word === "object" && typeof word.word === "string")
        )
        .slice(0, 20),
      supported: true,
    };
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
