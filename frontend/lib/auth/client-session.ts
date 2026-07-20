import type { Admin } from "@/types/admin";
import type { User } from "@/types/user";

const USER_SESSION_STORAGE_KEY = "nexband_session_user";
const ADMIN_SESSION_STORAGE_KEY = "nexband_admin_session";

function readSession<TAccount>(key: string): TAccount | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as TAccount) : null;
  } catch {
    return null;
  }
}

function writeSession<TAccount>(key: string, account: TAccount | null) {
  if (typeof window === "undefined") return;
  if (account === null) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, JSON.stringify(account));
}

export const getStoredSessionUser = () => readSession<User>(USER_SESSION_STORAGE_KEY);
export const persistSessionUser = (user: User | null) => writeSession(USER_SESSION_STORAGE_KEY, user);
export const clearUserSession = () => writeSession<User>(USER_SESSION_STORAGE_KEY, null);

export const getStoredAdminSession = () => readSession<Admin>(ADMIN_SESSION_STORAGE_KEY);
export const persistAdminSession = (admin: Admin | null) => writeSession(ADMIN_SESSION_STORAGE_KEY, admin);
export const clearAdminSession = () => writeSession<Admin>(ADMIN_SESSION_STORAGE_KEY, null);
