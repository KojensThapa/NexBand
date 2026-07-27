import { AppError } from "../../core/errors/app-error";

/**
 * Base error for every failure raised by the dataset management layer.
 * Extending AppError lets the global Fastify error handler format these
 * consistently with the rest of the API without any extra wiring.
 */
export abstract class DatasetError extends AppError {
  protected constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(statusCode, code, message, details);
    this.name = new.target.name;
  }
}

export class DatasetFileNotFoundError extends DatasetError {
  constructor(filePath: string) {
    super(404, "DATASET_FILE_NOT_FOUND", `Dataset file was not found: ${filePath}`, { filePath });
  }
}

export class DatasetParseError extends DatasetError {
  constructor(filePath: string, cause: unknown) {
    super(500, "DATASET_PARSE_ERROR", `Failed to parse dataset file: ${filePath}`, {
      filePath,
      cause: cause instanceof Error ? cause.message : String(cause),
    });
  }
}

/**
 * Raised when code asks the service for a dataset key it never registered.
 * This is a programmer error (a typo or missing definition), not a runtime
 * data problem, so it is kept separate from DatasetFileNotFoundError.
 */
export class DatasetNotRegisteredError extends DatasetError {
  constructor(datasetKey: string) {
    super(500, "DATASET_NOT_REGISTERED", `No dataset is registered for key: ${datasetKey}`, {
      datasetKey,
    });
  }
}
