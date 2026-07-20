import { API_BASE_URL } from "@/lib/constants";

const API_TOKEN_STORAGE_KEY = "nexband_api_token";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function saveApiToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem(API_TOKEN_STORAGE_KEY, token);
}

export function clearApiToken() {
  if (typeof window !== "undefined") localStorage.removeItem(API_TOKEN_STORAGE_KEY);
}

function getApiToken() {
  return typeof window === "undefined" ? null : localStorage.getItem(API_TOKEN_STORAGE_KEY);
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = getApiToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new ApiRequestError(payload?.message ?? `API error: ${res.status}`, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
