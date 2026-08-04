import bcrypt from "bcrypt";
import { randomBytes, randomInt, createHash } from "node:crypto";
import type { Role } from "@prisma/client";
import { AuthRepository } from "./auth.repository";
import { sendOtpEmail, sendPasswordResetEmail } from "../../shared/mail.service";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInitiateInput,
  RegisterInput,
  RegisterVerifyInput,
  ResendOtpInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from "./auth.schemas";

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRY_MS = 20 * 60 * 1000;

function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

type PublicUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class AuthService {
  private authRepository = new AuthRepository();

  private toPublicUser(user: {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PublicUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async register(data: RegisterInput, role: Role) {
    // Check if email already exists
    const existingUser = await this.authRepository.findUserByEmail(data.email);

    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.authRepository.createUser({
      ...data,
      password: hashedPassword,
      role,
    });

    return this.toPublicUser(user);
  }

  async login(data: LoginInput, role: Role) {
    // Find user by email
    const user = await this.authRepository.findUserByEmail(data.email);

    if (!user || user.role !== role) {
      throw new Error("Invalid email or password");
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    return this.toPublicUser(user);
  }

  // Email OTP verification: no User row is created until the OTP is verified.
  async registerInitiate(data: RegisterInitiateInput) {
    const existingUser = await this.authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await this.authRepository.upsertPendingRegistration({
      fullName: data.fullName,
      email: data.email,
      passwordHash,
      otpHash,
      otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    });

    await sendOtpEmail(data.email, data.fullName, otp);
  }

  async registerVerify(data: RegisterVerifyInput) {
    const pending = await this.authRepository.findPendingRegistrationByEmail(data.email);
    if (!pending) {
      throw new Error("No pending registration found for this email. Please sign up again.");
    }

    if (pending.otpExpiresAt.getTime() < Date.now()) {
      throw new Error("Verification code expired. Please request a new one.");
    }

    if (pending.attempts >= OTP_MAX_ATTEMPTS) {
      throw new Error("Too many incorrect attempts. Please request a new code.");
    }

    const otpMatches = await bcrypt.compare(data.otp, pending.otpHash);
    if (!otpMatches) {
      await this.authRepository.incrementPendingRegistrationAttempts(data.email);
      throw new Error("Invalid verification code.");
    }

    const user = await this.authRepository.createUser({
      fullName: pending.fullName,
      email: pending.email,
      password: pending.passwordHash,
      role: "USER",
    });
    await this.authRepository.markEmailVerified(user.id);
    await this.authRepository.deletePendingRegistration(data.email);

    return this.toPublicUser(user);
  }

  async resendOtp(data: ResendOtpInput) {
    const pending = await this.authRepository.findPendingRegistrationByEmail(data.email);
    if (!pending) {
      throw new Error("No pending registration found for this email. Please sign up again.");
    }

    const elapsedMs = Date.now() - pending.lastSentAt.getTime();
    if (elapsedMs < OTP_RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsedMs) / 1000);
      throw new Error(`Please wait ${waitSeconds}s before requesting another code.`);
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await this.authRepository.touchPendingRegistrationOtp(data.email, {
      otpHash,
      otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    });

    await sendOtpEmail(pending.email, pending.fullName, otp);
  }

  // Forgot / reset password. Errors never reveal whether an email exists.
  async forgotPassword(data: ForgotPasswordInput) {
    const user = await this.authRepository.findUserByEmail(data.email);
    if (!user) return;

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(rawToken);

    await this.authRepository.invalidatePasswordResetTokens(user.id);
    await this.authRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
    });

    const frontendUrl = (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail(user.email, user.fullName, resetUrl);
  }

  async resetPassword(data: ResetPasswordInput) {
    const tokenHash = hashResetToken(data.token);
    const resetToken = await this.authRepository.findValidPasswordResetTokenByHash(tokenHash);
    if (!resetToken) {
      throw new Error("This reset link is invalid or has expired.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    await this.authRepository.updatePassword(resetToken.userId, hashedPassword);
    await this.authRepository.markPasswordResetTokenUsed(resetToken.id);
  }

  async getUser(id: string) {
    const user = await this.authRepository.findUserById(id);
    if (!user) throw new Error("Account not found");

    return this.toPublicUser(user);
  }

  async updateProfile(id: string, data: UpdateProfileInput) {
    await this.getUser(id);
    const user = await this.authRepository.updateUser(id, data);
    return this.toPublicUser(user);
  }

  async deleteAccount(id: string) {
    await this.getUser(id);
    await this.authRepository.deleteUser(id);
  }
}

