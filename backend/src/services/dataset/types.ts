/**
 * The top-level folders under src/datasets. Each one maps 1:1 to a
 * subdirectory on disk, so adding a new category means adding a value
 * here and creating the matching folder.
 */
export type DatasetCategory =
  | "reading"
  | "listening"
  | "speaking"
  | "writing"
  | "vocabulary"
  | "feedback_templates";

/** Cache key shape: "<category>/<fileName>", e.g. "reading/reading_questions.csv" */
export type DatasetCacheKey = `${DatasetCategory}/${string}`;

export interface LoadOptions {
  /**
   * When true, drops any cached copy of this dataset before loading so the
   * CSV file is read from disk again. Datasets are otherwise cached forever
   * after their first load, per the "never reload unless explicitly
   * requested" rule.
   */
  forceReload?: boolean;
}
