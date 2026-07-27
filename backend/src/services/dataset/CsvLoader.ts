import { createReadStream } from "node:fs";
import { access, readdir } from "node:fs/promises";
import path from "node:path";

import csvParser from "csv-parser";

import { DatasetFileNotFoundError, DatasetParseError } from "./errors";

/**
 * Reads CSV files from disk. This class has exactly one responsibility:
 * turning a CSV file into an array of row objects. It knows nothing about
 * caching or which dataset a file belongs to.
 */
export class CsvLoader {
  /**
   * Streams a single CSV file and resolves with every row, typed as T.
   * csv-parser reports all fields as strings; callers own any numeric
   * conversion they need.
   */
  static async load<T>(filePath: string): Promise<T[]> {
    await CsvLoader.assertFileExists(filePath);

    return new Promise<T[]>((resolve, reject) => {
      const rows: T[] = [];

      createReadStream(filePath)
        .on("error", (error) => reject(new DatasetParseError(filePath, error)))
        .pipe(csvParser())
        .on("data", (row: Record<string, string>) => rows.push(row as unknown as T))
        .on("end", () => resolve(rows))
        .on("error", (error: unknown) => reject(new DatasetParseError(filePath, error)));
    });
  }

  /**
   * Recursively lists every .csv file under rootDir. Useful for diagnostics
   * (e.g. verifying every registered dataset actually exists on disk)
   * without hardcoding the directory layout in more than one place.
   */
  static async listCsvFiles(rootDir: string): Promise<string[]> {
    const entries = await readdir(rootDir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const entryPath = path.join(rootDir, entry.name);

      if (entry.isDirectory()) {
        files.push(...(await CsvLoader.listCsvFiles(entryPath)));
      } else if (entry.isFile() && entry.name.endsWith(".csv")) {
        files.push(entryPath);
      }
    }

    return files;
  }

  private static async assertFileExists(filePath: string): Promise<void> {
    try {
      await access(filePath);
    } catch {
      throw new DatasetFileNotFoundError(filePath);
    }
  }
}
