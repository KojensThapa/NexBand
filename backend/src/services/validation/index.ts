import { datasetService } from "../dataset";

import { ValidationEngine } from "./ValidationEngine";

export { ValidationEngine } from "./ValidationEngine";
export { TextValidator } from "./TextValidator";
export { RandomTextDetector } from "./RandomTextDetector";
export { StatisticsCalculator } from "./StatisticsCalculator";
export type {
  InvalidResponseProvider,
  TextStatisticsCalculator,
  RandomTextScorer,
  ResponseValidator,
} from "./interfaces";
export type { ValidationTarget, ValidationOptions, ValidationStatistics, ValidationResult } from "./types";

/**
 * Shared singleton wired to the shared DatasetService instance, for modules
 * that just need "the" validation engine. Modules that want a different
 * template source or a swapped-in collaborator (e.g. in tests, or a future
 * ML-based RandomTextDetector) can still construct
 * `new ValidationEngine(customProvider, ...)` directly.
 */
export const validationEngine = new ValidationEngine(datasetService);
