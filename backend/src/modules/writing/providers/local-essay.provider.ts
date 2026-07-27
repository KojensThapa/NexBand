import type { EssayAnalysis } from "../algorithm/types";
import type { EssayAnalysisProvider } from "./provider.interface";

/**
 * No-op essay analysis fallback. Returning an empty analysis lets the
 * deterministic task-achievement, coherence, and vocabulary calculators
 * operate entirely on local evidence when Gemini is unavailable.
 */
export class LocalEssayAnalysisProvider implements EssayAnalysisProvider {
  async analyze(): Promise<EssayAnalysis> {
    return {};
  }
}
