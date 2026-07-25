import type { EssayAnalysis } from "../algorithm/types";
import type { EssayAnalysisProvider } from "./provider.interface";

/**
 * No-op essay analysis provider used when no external AI essay provider
 * (WRITING_ESSAY_ENDPOINT) is configured. Returning an empty analysis lets
 * the deterministic algorithm layer (taskAchievement/coherence/vocabulary
 * calculators) fall back entirely to its own local heuristics.
 */
export class LocalEssayAnalysisProvider implements EssayAnalysisProvider {
  async analyze(): Promise<EssayAnalysis> {
    return {};
  }
}
