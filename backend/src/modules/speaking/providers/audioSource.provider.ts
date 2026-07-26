import type { AudioReference } from "./speechToText.provider";
import { SpeakingProviderError } from "./speechToText.provider";

export interface AudioBinary {
  bytes: Uint8Array;
  mimeType: string;
}

export type LocalUploadAudioResolver = (audio: AudioReference) => Promise<AudioBinary>;

function isLocalAudioPath(value: string): boolean {
  return value.startsWith("/uploads/audio/") && !value.includes("..") && !value.includes("\\");
}

/**
 * Downloads only application-owned upload paths. This keeps the pronunciation
 * adapter from becoming an SSRF proxy for arbitrary learner-supplied URLs.
 */
export function createLocalUploadAudioResolver(
  apiBaseUrl: string,
  fetchImplementation: typeof fetch = fetch
): LocalUploadAudioResolver {
  return async (audio) => {
    if (!audio.audioUrl || !isLocalAudioPath(audio.audioUrl)) {
      throw new SpeakingProviderError(
        "Pronunciation analysis needs an application-uploaded audio recording.",
        422
      );
    }

    const response = await fetchImplementation(new URL(audio.audioUrl, apiBaseUrl));
    if (!response.ok) throw new SpeakingProviderError("Uploaded audio could not be loaded for pronunciation analysis.");

    const mimeType = response.headers.get("content-type")?.split(";")[0] || audio.mimeType || "audio/webm";
    return { bytes: new Uint8Array(await response.arrayBuffer()), mimeType };
  };
}

export function isRemoteHttpAudioUrl(audioUrl: string | undefined): audioUrl is string {
  return Boolean(audioUrl && /^https:\/\//i.test(audioUrl));
}
