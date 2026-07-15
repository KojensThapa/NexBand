import {
  clearPasswordResetOtp,
  isPasswordResetVerified,
} from "@/lib/auth/otp";
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
    image: admin.image,
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

export function findAdminByEmail(email: string): Admin | null {
  const normalized = normalizeEmail(email);
  const match = readAdmins().find((admin) => admin.email === normalized);
  return match ? toPublicAdmin(match) : null;
}

export function resetAdminPassword(input: {
  email: string;
  newPassword: string;
  confirmPassword: string;
}): void {
  const email = normalizeEmail(input.email);
  const newPassword = input.newPassword;
  const confirmPassword = input.confirmPassword;

  if (!email) throw new AdminAuthError("Email is required.");
  if (!isPasswordResetVerified(email, "admin")) {
    throw new AdminAuthError("Please verify the OTP before resetting your password.");
  }
  if (!newPassword) throw new AdminAuthError("New password is required.");
  if (newPassword.length < 6) {
    throw new AdminAuthError("Password must be at least 6 characters.");
  }
  if (newPassword !== confirmPassword) {
    throw new AdminAuthError("Passwords do not match.");
  }

  const admins = readAdmins();
  const index = admins.findIndex((admin) => admin.email === email);
  if (index === -1) {
    throw new AdminAuthError("No admin account found with this email.");
  }

  admins[index] = { ...admins[index], password: newPassword };
  writeAdmins(admins);
  clearPasswordResetOtp();
}

export function updateAdminProfile(
  adminId: string,
  updates: { name?: string; image?: string }
): Admin {
  const admins = readAdmins();
  const index = admins.findIndex((admin) => admin.id === adminId);
  if (index === -1) throw new AdminAuthError("Admin not found.");

  const nextName = updates.name !== undefined ? updates.name.trim() : admins[index].name;
  if (!nextName) throw new AdminAuthError("Name is required.");

  const updated: StoredAdmin = {
    ...admins[index],
    name: nextName,
    // The profile form always sends its current image value. Checking whether
    // the property was supplied lets an explicit `undefined` remove an
    // existing photo while an omitted property keeps it unchanged.
    image: Object.prototype.hasOwnProperty.call(updates, "image")
      ? updates.image
      : admins[index].image,
  };

  admins[index] = updated;
  writeAdmins(admins);
  return toPublicAdmin(updated);
}

export function deleteAdminAccount(adminId: string): void {
  const admins = readAdmins();
  const filtered = admins.filter((admin) => admin.id !== adminId);
  if (filtered.length === admins.length) {
    throw new AdminAuthError("Admin not found.");
  }
  writeAdmins(filtered);

  const session = getStoredAdminSession();
  if (session?.id === adminId) {
    clearAdminAuthStorage();
  }
}
