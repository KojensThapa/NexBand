/**
 * In-memory cache for loaded datasets. This class has exactly one
 * responsibility: storing and retrieving values by key. It knows nothing
 * about CSV files or dataset business logic.
 *
 * Values are cached as Promises rather than resolved arrays so that
 * concurrent requests for the same not-yet-loaded dataset share a single
 * in-flight read instead of each triggering their own disk read.
 */
export class DatasetCache {
  private readonly store = new Map<string, Promise<unknown[]>>();

  has(key: string): boolean {
    return this.store.has(key);
  }

  get<T>(key: string): Promise<T[]> | undefined {
    return this.store.get(key) as Promise<T[]> | undefined;
  }

  set<T>(key: string, value: Promise<T[]>): void {
    this.store.set(key, value);
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
