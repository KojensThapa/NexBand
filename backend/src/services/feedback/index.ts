import { datasetService } from "../dataset";

import { DefaultConditionMatcher, FeedbackEngine } from "./FeedbackEngine";

export { FeedbackEngine, DefaultConditionMatcher } from "./FeedbackEngine";
export { FeedbackBuilder } from "./FeedbackBuilder";
export type { ConditionMatcher, FeedbackTemplateProvider } from "./interfaces";
export type { EvaluationInput, EvaluationContext, FeedbackResult, ComparisonOperator } from "./types";

/**
 * Shared singleton wired to the shared DatasetService instance, for modules
 * that just need "the" feedback engine. Modules that want a different
 * template source or condition strategy (e.g. in tests) can still
 * construct `new FeedbackEngine(customProvider, customMatcher)` directly.
 */
export const feedbackEngine = new FeedbackEngine(datasetService, new DefaultConditionMatcher());
