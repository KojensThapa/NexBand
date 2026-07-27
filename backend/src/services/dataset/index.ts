import { DatasetService } from "./DatasetService";

export { DatasetService } from "./DatasetService";
export { CsvLoader } from "./CsvLoader";
export { DatasetCache } from "./DatasetCache";
export { DatasetError, DatasetFileNotFoundError, DatasetParseError, DatasetNotRegisteredError } from "./errors";
export type { DatasetCategory, DatasetCacheKey, LoadOptions } from "./types";
export * from "./interfaces";

/**
 * Shared singleton for modules that just need "the" dataset service without
 * managing their own instance. Modules that need a different datasets root
 * (e.g. for tests) can still construct `new DatasetService(customRoot)`.
 */
export const datasetService = new DatasetService();
