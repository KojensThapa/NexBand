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

export function loginApiUser(input: LoginInput) {
  return login(input, "USER") as Promise<AuthSession<User>>;
}

export function loginApiAdmin(input: LoginInput) {
  return login(input, "ADMIN") as Promise<AuthSession<Admin>>;
}

export function signOutApiUser() {
  clearApiToken();
}

// Email OTP verification (shared by user and admin registration)
async function doRegisterInitiate(input: RegisterInput, role: Role): Promise<void> {
  await apiFetch<{ success: true; message: string }>(
    role === "ADMIN" ? "/api/auth/admin/register/initiate" : "/api/auth/register/initiate",
    {
      method: "POST",
      body: JSON.stringify({
        fullName: input.name,
        email: input.email,
        password: input.password,
      }),
    }
  );
}

async function doRegisterVerify(input: { email: string; otp: string }, role: Role) {
  const response = await apiFetch<{
    success: true;
    token: string;
    user: ApiUser;
  }>(role === "ADMIN" ? "/api/auth/admin/register/verify" : "/api/auth/register/verify", {
    method: "POST",
    body: JSON.stringify(input),
  });

  saveApiToken(response.token);

  return { user: response.user, token: response.token };
}

async function doResendOtp(email: string, role: Role): Promise<void> {
  await apiFetch<{ success: true; message: string }>(
    role === "ADMIN" ? "/api/auth/admin/resend-otp" : "/api/auth/resend-otp",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    }
  );
}

export function registerInitiate(input: RegisterInput): Promise<void> {
  return doRegisterInitiate(input, "USER");
}

export function registerInitiateApiAdmin(input: RegisterInput): Promise<void> {
  return doRegisterInitiate(input, "ADMIN");
}

export async function registerVerify(input: { email: string; otp: string }): Promise<AuthSession<User>> {
  const { user, token } = await doRegisterVerify(input, "USER");
  return { user: toUser(user), token };
}

export async function registerVerifyApiAdmin(input: { email: string; otp: string }): Promise<AuthSession<Admin>> {
  const { user, token } = await doRegisterVerify(input, "ADMIN");
  return { user: toAdmin(user), token };
}

export function resendOtp(email: string): Promise<void> {
  return doResendOtp(email, "USER");
}

export function resendOtpApiAdmin(email: string): Promise<void> {
  return doResendOtp(email, "ADMIN");
}

// Forgot / reset password
export async function forgotPassword(email: string): Promise<void> {
  await apiFetch<{ success: true; message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function forgotPasswordApiAdmin(email: string): Promise<void> {
  await apiFetch<{ success: true; message: string }>("/api/auth/admin/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(input: { token: string; password: string }): Promise<void> {
  await apiFetch<{ success: true; message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
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
