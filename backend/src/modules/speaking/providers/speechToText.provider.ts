export interface AudioReference {
  audioUrl?: string;
  audioStorageKey?: string;
  mimeType?: string;
  /** Used only when an upstream upload/transcription flow already supplied it. */
  transcript?: string;
}

export interface SpeechToTextRequest {
  audio: AudioReference;
  language?: string;
  correlationId?: string;
}

export interface SpeechToTextResult {
  transcript: string;
  confidence?: number;
}

export interface SpeechToTextProvider {
  transcribe(input: SpeechToTextRequest): Promise<SpeechToTextResult>;
}

export class SpeakingProviderError extends Error {
  constructor(message: string, readonly statusCode = 503) {
    super(message);
    this.name = "SpeakingProviderError";
  }
}

/**
 * Allows a trusted upstream transcription to pass through while still keeping
 * the orchestration flow at the provider boundary. Raw audio without a
 * configured delegate fails closed instead of inventing a transcript.
 */
export class TranscriptFallbackSpeechToTextProvider implements SpeechToTextProvider {
  constructor(private readonly delegate?: SpeechToTextProvider) {}

  async transcribe(input: SpeechToTextRequest): Promise<SpeechToTextResult> {
    const transcript = input.audio.transcript?.trim();
    if (transcript) return { transcript };
    if (this.delegate) return this.delegate.transcribe(input);
    throw new SpeakingProviderError(
      "Speech-to-text is not configured. Supply a transcription provider or a trusted transcript."
    );
  }
}

export interface HttpSpeechToTextProviderOptions {
  endpoint: string;
  apiKey?: string;
  fetchImplementation?: typeof fetch;
}

/** Generic JSON adapter for a separately hosted STT provider. */
export class HttpSpeechToTextProvider implements SpeechToTextProvider {
  private readonly fetchImplementation: typeof fetch;

  constructor(private readonly options: HttpSpeechToTextProviderOptions) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  async transcribe(input: SpeechToTextRequest): Promise<SpeechToTextResult> {
    const response = await this.fetchImplementation(this.options.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.options.apiKey ? { authorization: `Bearer ${this.options.apiKey}` } : {}),
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new SpeakingProviderError("Speech-to-text provider request failed.");
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || typeof (body as { transcript?: unknown }).transcript !== "string") {
      throw new SpeakingProviderError("Speech-to-text provider returned an invalid transcript.");
    }
    return {
      transcript: (body as { transcript: string }).transcript,
      ...(typeof (body as { confidence?: unknown }).confidence === "number"
        ? { confidence: (body as { confidence: number }).confidence }
        : {}),
    };
  }
}

