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

export interface DeepgramSpeechToTextProviderOptions {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  localUploadAudioResolver?: import("./audioSource.provider").LocalUploadAudioResolver;
  fetchImplementation?: typeof fetch;
}

type DeepgramResponse = {
  results?: {
    channels?: Array<{
      alternatives?: Array<{ transcript?: string; confidence?: number }>;
    }>;
  };
};

/** Direct Deepgram adapter for uploaded audio and durable HTTPS recording URLs. */
export class DeepgramSpeechToTextProvider implements SpeechToTextProvider {
  private readonly fetchImplementation: typeof fetch;

  constructor(private readonly options: DeepgramSpeechToTextProviderOptions) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  async transcribe(input: SpeechToTextRequest): Promise<SpeechToTextResult> {
    if (!this.options.apiKey) {
      throw new SpeakingProviderError("Speech-to-text is not configured. Set DEEPGRAM_API_KEY.");
    }

    const endpoint = new URL(this.options.endpoint ?? "https://api.deepgram.com/v1/listen");
    endpoint.searchParams.set("model", this.options.model ?? "nova-3");
    endpoint.searchParams.set("smart_format", "true");
    if (input.language) endpoint.searchParams.set("language", input.language);

    let body: BodyInit;
    let contentType: string;
    if (input.audio.audioUrl?.startsWith("/uploads/audio/")) {
      if (!this.options.localUploadAudioResolver) {
        throw new SpeakingProviderError("Uploaded audio cannot be resolved for transcription.", 500);
      }
      const audio = await this.options.localUploadAudioResolver(input.audio);
      body = Buffer.from(audio.bytes) as unknown as BodyInit;
      contentType = audio.mimeType;
    } else if (input.audio.audioUrl && /^https:\/\//i.test(input.audio.audioUrl)) {
      body = JSON.stringify({ url: input.audio.audioUrl });
      contentType = "application/json";
    } else {
      throw new SpeakingProviderError("A server-accessible audio URL is required for transcription.", 422);
    }

    const response = await this.fetchImplementation(endpoint, {
      method: "POST",
      headers: {
        authorization: `Token ${this.options.apiKey}`,
        "content-type": contentType,
      },
      body,
    });
    if (!response.ok) throw new SpeakingProviderError("Deepgram transcription request failed.");

    const result = (await response.json()) as DeepgramResponse;
    const alternative = result.results?.channels?.[0]?.alternatives?.[0];
    const transcript = alternative?.transcript?.trim();
    if (!alternative || !transcript) {
      throw new SpeakingProviderError("Deepgram could not detect usable speech in this recording.", 422);
    }

    return {
      transcript,
      ...(typeof alternative.confidence === "number" ? { confidence: alternative.confidence } : {}),
    };
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
