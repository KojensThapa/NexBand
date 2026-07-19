import type { User } from "@/types/user";
import { apiFetch, clearApiToken, saveApiToken } from "./api";

type ApiUser = {
  id: string;
  fullName: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt?: string;
};

type ApiEnvelope<T> = { success: true; data: T };

function toUser(user: ApiUser): User {
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    createdAt: user.createdAt ?? new Date().toISOString(),
  };
}

export async function registerApiUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const response = await apiFetch<ApiEnvelope<ApiUser>>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: input.name,
      email: input.email,
      password: input.password,
    }),
  });
  return toUser(response.data);
}

export async function loginApiUser(input: { email: string; password: string }) {
  const response = await apiFetch<{
    success: true;
    token: string;
    user: ApiUser;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  saveApiToken(response.token);
  return toUser(response.user);
}

export function signOutApiUser() {
  clearApiToken();
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await apiFetch<{ success: true; user: { id: string; email: string } }>(
      "/auth/me"
    );
    return {
      id: response.user.id,
      name: response.user.email,
      email: response.user.email,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
