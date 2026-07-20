import type { Admin } from "@/types/admin";
import type { User } from "@/types/user";
import { apiFetch, clearApiToken, saveApiToken } from "./api";

type Role = "USER" | "ADMIN";

type ApiUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  image: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiEnvelope<T> = { success: true; data: T };

export type AuthSession<TAccount> = {
  user: TAccount;
  token: string;
};

function toUser(account: ApiUser): User {
  if (account.role !== "USER") throw new Error("This account is not a learner account.");

  return {
    id: account.id,
    name: account.fullName,
    email: account.email,
    role: "USER",
    image: account.image ?? undefined,
    createdAt: account.createdAt,
  };
}

function toAdmin(account: ApiUser): Admin {
  if (account.role !== "ADMIN") throw new Error("This account is not an admin account.");

  return {
    id: account.id,
    name: account.fullName,
    email: account.email,
    role: "ADMIN",
    image: account.image ?? undefined,
    createdAt: account.createdAt,
  };
}

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = Pick<RegisterInput, "email" | "password">;

async function register(input: RegisterInput, role: Role) {
  const response = await apiFetch<ApiEnvelope<ApiUser>>(
    role === "ADMIN" ? "/api/auth/admin/register" : "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        fullName: input.name,
        email: input.email,
        password: input.password,
      }),
    }
  );

  return role === "ADMIN" ? toAdmin(response.data) : toUser(response.data);
}

async function login(input: LoginInput, role: Role) {
  const response = await apiFetch<{
    success: true;
    token: string;
    user: ApiUser;
  }>(role === "ADMIN" ? "/api/auth/admin/login" : "/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  saveApiToken(response.token);

  return {
    user: role === "ADMIN" ? toAdmin(response.user) : toUser(response.user),
    token: response.token,
  };
}

export function registerApiUser(input: RegisterInput) {
  return register(input, "USER") as Promise<User>;
}

export function registerApiAdmin(input: RegisterInput) {
  return register(input, "ADMIN") as Promise<Admin>;
}

export function loginApiUser(input: LoginInput) {
  return login(input, "USER") as Promise<AuthSession<User>>;
}

export function loginApiAdmin(input: LoginInput) {
  return login(input, "ADMIN") as Promise<AuthSession<Admin>>;
}

export function signOutApiUser() {
  clearApiToken();
}

async function getCurrentAccount(expectedRole: Role) {
  try {
    const response = await apiFetch<ApiEnvelope<ApiUser>>("/api/auth/me");
    if (response.data.role !== expectedRole) {
      throw new Error("This session belongs to a different account type.");
    }
    return response.data;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const account = await getCurrentAccount("USER");
  return account ? toUser(account) : null;
}

export async function getCurrentAdmin(): Promise<Admin | null> {
  const account = await getCurrentAccount("ADMIN");
  return account ? toAdmin(account) : null;
}

export async function updateCurrentUser(input: { name?: string; image?: string | null }): Promise<User> {
  const response = await apiFetch<ApiEnvelope<ApiUser>>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify({
      ...(input.name !== undefined ? { fullName: input.name } : {}),
      ...(input.image !== undefined ? { image: input.image } : {}),
    }),
  });
  return toUser(response.data);
}

export async function updateCurrentAdmin(input: { name?: string; image?: string | null }): Promise<Admin> {
  const response = await apiFetch<ApiEnvelope<ApiUser>>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify({
      ...(input.name !== undefined ? { fullName: input.name } : {}),
      ...(input.image !== undefined ? { image: input.image } : {}),
    }),
  });
  return toAdmin(response.data);
}

export async function deleteCurrentAccount(): Promise<void> {
  await apiFetch<void>("/api/auth/me", { method: "DELETE" });
}
