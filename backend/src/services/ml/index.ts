import { RandomTextPredictor } from "./RandomTextPredictor";
import { RelevancePredictor } from "./RelevancePredictor";

export { PythonRunner, ML_SCRIPTS_DIR } from "./PythonRunner";
export { RelevancePredictor } from "./RelevancePredictor";
export { RandomTextPredictor } from "./RandomTextPredictor";
export type { PythonRunnerOptions, RelevancePrediction, RandomTextPrediction } from "./types";
export {
  MLPredictionError,
  PythonNotFoundError,
  PythonTimeoutError,
  PythonExecutionError,
  PythonInvalidJsonError,
  MLModelError,
} from "./types";

/**
 * Shared singletons with default options, for callers that just need "the"
 * predictors. Not wired into RelevanceEngine or ValidationEngine — that
 * integration is a separate, later step.
 */
export const relevancePredictor = new RelevancePredictor();
export const randomTextPredictor = new RandomTextPredictor();
