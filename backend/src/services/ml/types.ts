import { AppError } from "../../core/errors/app-error";

/** Options accepted by PythonRunner; both fields are optional and fall back to sane defaults. */
export interface PythonRunnerOptions {
  /** Milliseconds to wait before killing the child process. Defaults to 10_000. */
  timeoutMs?: number;
  /** Executable used to launch scripts. Defaults to "python" on Windows, "python3" elsewhere. */
  pythonExecutable?: string;
}

export interface RelevancePrediction {
  relevant: boolean;
  confidence: number;
}

export interface RandomTextPrediction {
  random: boolean;
  confidence: number;
}

/**
 * Base error for every failure raised while shelling out to a Python
 * prediction script. Extending AppError lets the global Fastify error
 * handler format these consistently with the rest of the API without any
 * extra wiring.
 */
export abstract class MLPredictionError extends AppError {
  protected constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(statusCode, code, message, details);
    this.name = new.target.name;
  }
}

/** The configured Python executable could not be launched (not installed / not on PATH). */
export class PythonNotFoundError extends MLPredictionError {
  constructor(pythonExecutable: string) {
    super(
      500,
      "PYTHON_NOT_FOUND",
      `Python executable "${pythonExecutable}" was not found. Install Python or configure a valid pythonExecutable.`,
      { pythonExecutable }
    );
  }
}

/** The script did not finish within the configured timeout and was killed. */
export class PythonTimeoutError extends MLPredictionError {
  constructor(scriptPath: string, timeoutMs: number) {
    super(504, "PYTHON_TIMEOUT", `Python script timed out after ${timeoutMs}ms: ${scriptPath}`, {
      scriptPath,
      timeoutMs,
    });
  }
}

/** The script exited with a non-zero status code. */
export class PythonExecutionError extends MLPredictionError {
  constructor(scriptPath: string, exitCode: number | null, stderr: string) {
    super(500, "PYTHON_EXECUTION_FAILED", `Python script "${scriptPath}" exited with code ${exitCode}.`, {
      scriptPath,
      exitCode,
      stderr: stderr.trim(),
    });
  }
}

/** The script's stdout could not be parsed as JSON. */
export class PythonInvalidJsonError extends MLPredictionError {
  constructor(scriptPath: string, stdout: string) {
    super(500, "PYTHON_INVALID_JSON", `Python script "${scriptPath}" did not return valid JSON.`, {
      scriptPath,
      stdout: stdout.trim(),
    });
  }
}

/**
 * The script ran successfully and printed valid JSON, but that JSON itself
 * is an `{"error": "..."}` payload — this is how predict_relevance.py and
 * predict_random_text.py report problems like a missing model/vectorizer
 * file or missing arguments.
 */
export class MLModelError extends MLPredictionError {
  constructor(scriptPath: string, reason: string) {
    super(422, "ML_MODEL_ERROR", `Python script "${scriptPath}" reported an error: ${reason}`, {
      scriptPath,
      reason,
    });
  }
}
