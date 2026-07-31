import path from "node:path";

import { ML_SCRIPTS_DIR, PythonRunner } from "./PythonRunner";
import type { PythonRunnerOptions, RandomTextPrediction } from "./types";

const SCRIPT_PATH = path.join(ML_SCRIPTS_DIR, "predict_random_text.py");

/**
 * Bridges to predict_random_text.py: given a piece of text, asks the
 * trained TF-IDF + logistic regression model whether it looks like
 * random/nonsensical input rather than real English. Purely a process
 * boundary — no validation logic lives here, and nothing about
 * ValidationEngine is touched or replaced.
 */
export class RandomTextPredictor {
  private readonly runner: PythonRunner;

  constructor(options: PythonRunnerOptions = {}) {
    this.runner = new PythonRunner(options);
  }

  predict(text: string): Promise<RandomTextPrediction> {
    return this.runner.run<RandomTextPrediction>(SCRIPT_PATH, [text]);
  }
}
