import path from "node:path";

import { ML_SCRIPTS_DIR, PythonRunner } from "./PythonRunner";
import type { PythonRunnerOptions, RelevancePrediction } from "./types";

const SCRIPT_PATH = path.join(ML_SCRIPTS_DIR, "predict_relevance.py");

/**
 * Bridges to predict_relevance.py: given a question and a response, asks
 * the trained TF-IDF + logistic regression model whether the response
 * addresses the question. Purely a process boundary — no relevance logic
 * lives here, and nothing about RelevanceEngine is touched or replaced.
 */
export class RelevancePredictor {
  private readonly runner: PythonRunner;

  constructor(options: PythonRunnerOptions = {}) {
    this.runner = new PythonRunner(options);
  }

  predict(question: string, response: string): Promise<RelevancePrediction> {
    return this.runner.run<RelevancePrediction>(SCRIPT_PATH, [question, response]);
  }
}
