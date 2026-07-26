import { SpeakingProviderError } from "./speechToText.provider";

export type GeminiJsonSchema = Record<string, unknown>;
export type GeminiContentPart = { text: string } | { inlineData: { mimeType: string; data: string } };

export interface GeminiJsonClientOptions {
  apiKey?: string;
  model?: string;
  fetchImplementation?: typeof fetch;
}

type GeminiApiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

function textFromResponse(body: GeminiApiResponse): string | undefined {
  return body.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
}

/**
 * Small vendor boundary for Gemini structured JSON. Individual analysis
 * providers own their prompts and validate their own response shapes.
 */
export class GeminiJsonClient {
  private readonly fetchImplementation: typeof fetch;
  private readonly model: string;

  constructor(private readonly options: GeminiJsonClientOptions) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.model = options.model ?? "gemini-2.5-flash";
  }

  async generate<T>(prompt: string, responseSchema: GeminiJsonSchema): Promise<T> {
    return this.generateFromParts([{ text: prompt }], responseSchema);
  }

  async generateFromParts<T>(parts: GeminiContentPart[], responseSchema: GeminiJsonSchema): Promise<T> {
    if (!this.options.apiKey) {
      throw new SpeakingProviderError("Gemini analysis is not configured. Set GEMINI_API_KEY.");
    }

    const response = await this.fetchImplementation(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.options.apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new SpeakingProviderError("Gemini analysis request failed.");
    }

    const body = (await response.json()) as GeminiApiResponse;
    const text = textFromResponse(body);
    if (!text) throw new SpeakingProviderError("Gemini analysis returned no structured result.");

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new SpeakingProviderError("Gemini analysis returned invalid JSON.");
    }
  }
}
