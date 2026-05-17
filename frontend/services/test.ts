import type { TestSession } from "@/types/test";
import { apiFetch } from "./api";

export async function startTest(
  examType: string,
  skill: string
): Promise<TestSession> {
  return apiFetch<TestSession>("/tests/start", {
    method: "POST",
    body: JSON.stringify({ examType, skill }),
  });
}
