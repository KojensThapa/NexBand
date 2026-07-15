const OTP_STORAGE_KEY = "nexband_password_reset_otp";
const OTP_EXPIRY_MS = 10 * 60 * 1000;

export type OtpRole = "user" | "admin";

interface StoredOtp {
  email: string;
  otp: string;
  role: OtpRole;
  verified: boolean;
  expiresAt: number;
}

function readOtp(): StoredOtp | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(OTP_STORAGE_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as StoredOtp;
    if (Date.now() > record.expiresAt) {
      localStorage.removeItem(OTP_STORAGE_KEY);
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

function writeOtp(record: StoredOtp) {
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(record));
}

function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function createPasswordResetOtp(email: string, role: OtpRole): string {
  const otp = generateOtpCode();
  writeOtp({
    email: email.trim().toLowerCase(),
    otp,
    role,
    verified: false,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  });
  return otp;
}

export function verifyPasswordResetOtp(
  email: string,
  otp: string,
  role: OtpRole
): boolean {
  const record = readOtp();
  if (!record) return false;
  if (record.role !== role) return false;
  if (record.email !== email.trim().toLowerCase()) return false;
  if (record.otp !== otp.trim()) return false;

  writeOtp({ ...record, verified: true });
  return true;
}

export function isPasswordResetVerified(email: string, role: OtpRole): boolean {
  const record = readOtp();
  if (!record) return false;
  return (
    record.verified &&
    record.role === role &&
    record.email === email.trim().toLowerCase()
  );
}

export function clearPasswordResetOtp() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OTP_STORAGE_KEY);
}
