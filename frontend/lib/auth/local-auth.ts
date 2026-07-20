import {
  clearPasswordResetOtp,
  isPasswordResetVerified,
} from "@/lib/auth/otp";
import type { User } from "@/types/user";

const USERS_STORAGE_KEY = "nexband_users";
const SESSION_USER_KEY = "nexband_session_user";

interface StoredUser extends User {
  password: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toPublicUser(user: StoredUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: "USER",
    image: user.image,
    createdAt: user.createdAt,
  };
}

export function getStoredSessionUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function persistSessionUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(SESSION_USER_KEY);
    return;
  }
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): User {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;
  const confirmPassword = input.confirmPassword;

  if (!name) throw new AuthError("Name is required.");
  if (!email) throw new AuthError("Email is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthError("Please enter a valid email address.");
  }
  if (!password) throw new AuthError("Password is required.");
  if (password.length < 6) {
    throw new AuthError("Password must be at least 6 characters.");
  }
  if (password !== confirmPassword) {
    throw new AuthError("Passwords do not match.");
  }

  const users = readUsers();
  if (users.some((user) => user.email === email)) {
    throw new AuthError("An account with this email already exists.");
  }

  const newUser: StoredUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    email,
    password,
    role: "USER",
    createdAt: new Date().toISOString(),
  };

  writeUsers([...users, newUser]);
  return toPublicUser(newUser);
}

export function loginUser(input: { email: string; password: string }): User {
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!email || !password) {
    throw new AuthError("Email and password are required.");
  }

  const users = readUsers();
  const match = users.find((user) => user.email === email);

  if (!match || match.password !== password) {
    throw new AuthError("Invalid email or password.");
  }

  return toPublicUser(match);
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_USER_KEY);
}

export function findUserByEmail(email: string): User | null {
  const normalized = normalizeEmail(email);
  const match = readUsers().find((user) => user.email === normalized);
  return match ? toPublicUser(match) : null;
}

export function resetUserPassword(input: {
  email: string;
  newPassword: string;
  confirmPassword: string;
}): void {
  const email = normalizeEmail(input.email);
  const newPassword = input.newPassword;
  const confirmPassword = input.confirmPassword;

  if (!email) throw new AuthError("Email is required.");
  if (!isPasswordResetVerified(email, "user")) {
    throw new AuthError("Please verify the OTP before resetting your password.");
  }
  if (!newPassword) throw new AuthError("New password is required.");
  if (newPassword.length < 6) {
    throw new AuthError("Password must be at least 6 characters.");
  }
  if (newPassword !== confirmPassword) {
    throw new AuthError("Passwords do not match.");
  }

  const users = readUsers();
  const index = users.findIndex((user) => user.email === email);
  if (index === -1) {
    throw new AuthError("No account found with this email.");
  }

  users[index] = { ...users[index], password: newPassword };
  writeUsers(users);
  clearPasswordResetOtp();
}

export function updateUserProfile(
  userId: string,
  updates: { name?: string; image?: string }
): User {
  const users = readUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) throw new AuthError("User not found.");

  const nextName = updates.name !== undefined ? updates.name.trim() : users[index].name;
  if (!nextName) throw new AuthError("Name is required.");

  const updated: StoredUser = {
    ...users[index],
    name: nextName,
    // The profile form always sends its current image value. Checking whether
    // the property was supplied lets an explicit `undefined` remove an
    // existing photo while an omitted property keeps it unchanged.
    image: Object.prototype.hasOwnProperty.call(updates, "image")
      ? updates.image
      : users[index].image,
  };

  users[index] = updated;
  writeUsers(users);
  return toPublicUser(updated);
}

export function deleteUserAccount(userId: string): void {
  const users = readUsers();
  const filtered = users.filter((user) => user.id !== userId);
  if (filtered.length === users.length) {
    throw new AuthError("User not found.");
  }
  writeUsers(filtered);

  const session = getStoredSessionUser();
  if (session?.id === userId) {
    clearAuthStorage();
  }
}
