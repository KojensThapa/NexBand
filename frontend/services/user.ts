import type { User } from "@/types/user";
import { apiFetch } from "./api";

export async function updateProfile(
  data: Partial<Pick<User, "name">>
): Promise<User> {
  return apiFetch<User>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
