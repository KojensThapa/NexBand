import { spawn } from "node:child_process";
import path from "node:path";

import {
  MLModelError,
  PythonExecutionError,
  PythonInvalidJsonError,
  PythonNotFoundError,
  PythonTimeoutError,
} from "./types";
import type { PythonRunnerOptions } from "./types";

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * backend/src/datasets/ml, resolved relative to this file (not the process
 * cwd) so predictors find the scripts no matter where the Node process is
 * launched from. Mirrors the __dirname-relative convention already used by
 * DatasetService for backend/src/datasets.
 */
export const ML_SCRIPTS_DIR = path.resolve(__dirname, "..", "..", "datasets", "ml");

function defaultPythonExecutable(): string {
  return process.platform === "win32" ? "python" : "python3";
}

interface ErrorPayload {
  error: unknown;
}

function isErrorPayload(value: unknown): value is ErrorPayload {
  return typeof value === "object" && value !== null && "error" in value;
}

/**
 * Executes a Python prediction script (predict_relevance.py /
 * predict_random_text.py) as a child process and parses its single-line
 * JSON stdout into a typed result. Every script under datasets/ml is
 * expected to print exactly one JSON object and nothing else, so one runner
 * covers all of them — it never knows what the JSON *means*, only how to
 * get it out of the process safely.
 */
export class PythonRunner {
  private readonly timeoutMs: number;
  private readonly pythonExecutable: string;

  constructor(options: PythonRunnerOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.pythonExecutable = options.pythonExecutable ?? defaultPythonExecutable();
  }

  run<T>(scriptPath: string, args: string[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let settled = false;
      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      // No shell: args are passed straight to the OS, so quotes/semicolons
      // in question/response/text can never be interpreted as shell syntax.
      const child = spawn(this.pythonExecutable, [scriptPath, ...args], { windowsHide: true });

      let stdout = "";
      let stderr = "";

      const timer = setTimeout(() => {
        settle(() => {
          child.kill("SIGKILL");
          reject(new PythonTimeoutError(scriptPath, this.timeoutMs));
        });
      }, this.timeoutMs);

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on("error", (error: NodeJS.ErrnoException) => {
        clearTimeout(timer);
        settle(() => {
          if (error.code === "ENOENT") {
            reject(new PythonNotFoundError(this.pythonExecutable));
          } else {
            reject(new PythonExecutionError(scriptPath, null, error.message));
          }
        });
      });

      child.on("close", (exitCode) => {
        clearTimeout(timer);
        settle(() => {
          if (exitCode !== 0) {
            reject(new PythonExecutionError(scriptPath, exitCode, stderr));
            return;
          }

          // A clean exit can still write warnings (e.g. library deprecation
          // notices) to stderr; that's not fatal, just worth surfacing.
          if (stderr.trim().length > 0) {
            console.warn(`[PythonRunner] ${scriptPath} wrote to stderr:\n${stderr.trim()}`);
          }

          let parsed: unknown;
          try {
            parsed = JSON.parse(stdout.trim());
          } catch {
            reject(new PythonInvalidJsonError(scriptPath, stdout));
            return;
          }

          if (isErrorPayload(parsed)) {
            reject(new MLModelError(scriptPath, String(parsed.error)));
            return;
          }

          resolve(parsed as T);
        });
      });
    });
  }
}
