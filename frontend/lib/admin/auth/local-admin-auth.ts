import type { Admin } from "@/types/admin";

const ADMINS_STORAGE_KEY = "nexband_admins";
const ADMIN_SESSION_KEY = "nexband_admin_session";

interface StoredAdmin extends Admin {
  password: string;
}

export class AdminAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthError";
  }
}

function readAdmins(): StoredAdmin[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADMINS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredAdmin[];
  } catch {
    return [];
  }
}

function writeAdmins(admins: StoredAdmin[]) {
  localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(admins));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toPublicAdmin(admin: StoredAdmin): Admin {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    createdAt: admin.createdAt,
  };
}

export function getStoredAdminSession(): Admin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Admin;
  } catch {
    return null;
  }
}

export function persistAdminSession(admin: Admin | null) {
  if (typeof window === "undefined") return;
  if (!admin) {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    return;
  }
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(admin));
}

export function registerAdmin(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Admin {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;
  const confirmPassword = input.confirmPassword;

  if (!name) throw new AdminAuthError("Name is required.");
  if (!email) throw new AdminAuthError("Email is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AdminAuthError("Please enter a valid email address.");
  }
  if (!password) throw new AdminAuthError("Password is required.");
  if (password.length < 6) {
    throw new AdminAuthError("Password must be at least 6 characters.");
  }
  if (password !== confirmPassword) {
    throw new AdminAuthError("Passwords do not match.");
  }

  const admins = readAdmins();
  if (admins.some((admin) => admin.email === email)) {
    throw new AdminAuthError("An admin account with this email already exists.");
  }

  const newAdmin: StoredAdmin = {
    id: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    email,
    password,
    createdAt: new Date().toISOString(),
  };

  writeAdmins([...admins, newAdmin]);
  return toPublicAdmin(newAdmin);
}

export function loginAdmin(input: { email: string; password: string }): Admin {
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!email || !password) {
    throw new AdminAuthError("Email and password are required.");
  }

  const admins = readAdmins();
  const match = admins.find((admin) => admin.email === email);

  if (!match || match.password !== password) {
    throw new AdminAuthError("Invalid email or password.");
  }

  return toPublicAdmin(match);
}

export function clearAdminAuthStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
}
