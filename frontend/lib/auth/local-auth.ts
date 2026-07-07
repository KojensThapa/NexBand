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
