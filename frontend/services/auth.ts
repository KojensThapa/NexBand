import type { User } from "@/types/user";
import { apiFetch } from "./api";

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await apiFetch<User>("/auth/me");
  } catch {
    return null;
  }
}
