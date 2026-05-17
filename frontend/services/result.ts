import type { TestResult } from "@/types/result";
import { apiFetch } from "./api";

export async function getTestResult(testId: string): Promise<TestResult> {
  return apiFetch<TestResult>(`/results/${testId}`);
}
