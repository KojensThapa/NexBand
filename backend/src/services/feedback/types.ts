/**
 * The evaluation result the Feedback Engine consumes. Evaluation modules
 * (reading/listening/speaking/writing) compute these numbers elsewhere; the
 * Feedback Engine never calculates a score, it only reads them.
 *
 * `overallBand` is always required. Every other key is an arbitrary skill
 * name mapped to its numeric score, e.g. `{ grammar: 7, vocabulary: 8 }`.
 * Different modules score different skills (Writing has taskResponse,
 * Speaking has pronunciation/fluency, etc.), so this is intentionally an
 * open map rather than a fixed set of fields.
 */
export interface EvaluationInput {
  overallBand: number;
  [skill: string]: number;
}

/**
 * Flat skill-name -> score lookup used internally when matching template
 * conditions and interpolating template placeholders. It is structurally
 * identical to EvaluationInput; the separate name just documents intent.
 */
export type EvaluationContext = Record<string, number>;

export type ComparisonOperator = ">=" | "<=" | "==" | "!=" | ">" | "<";

/**
 * The shape every call to the Feedback Engine returns. Any field with no
 * matching template resolves to an empty array/string rather than throwing,
 * so an evaluation module can always render something.
 */
export interface FeedbackResult {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  scoreComment: string;
  summary: string;
}
