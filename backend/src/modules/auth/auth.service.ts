import bcrypt from "bcrypt";
import { randomBytes, randomInt, createHash } from "node:crypto";
import { Prisma, type Role } from "@prisma/client";
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
const ADMIN_ALREADY_EXISTS_MESSAGE =
  "An admin account already exists. Only one admin account is allowed.";

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
    // Check if email already exists for this role (the same email may exist
    // as both a USER and an ADMIN, but not twice for the same role).
    const existingUser = await this.authRepository.findUserByEmail(data.email, role);

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
    // Find user by email, scoped to this role (the same email may also exist
    // under the other role)
    const user = await this.authRepository.findUserByEmail(data.email, role);

    if (!user) {
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
  async registerInitiate(data: RegisterInitiateInput, role: Role) {
    // Only one ADMIN account may exist system-wide. Reject before even
    // sending an OTP so a second admin signup never gets this far.
    if (role === "ADMIN" && (await this.authRepository.adminExists())) {
      throw new Error(ADMIN_ALREADY_EXISTS_MESSAGE);
    }

    const existingUser = await this.authRepository.findUserByEmail(data.email, role);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await this.authRepository.upsertPendingRegistration({
      fullName: data.fullName,
      email: data.email,
      role,
      passwordHash,
      otpHash,
      otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    });

    await sendOtpEmail(data.email, data.fullName, otp);
  }

  async registerVerify(data: RegisterVerifyInput, role: Role) {
    const pending = await this.authRepository.findPendingRegistrationByEmail(data.email, role);
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
      await this.authRepository.incrementPendingRegistrationAttempts(data.email, role);
      throw new Error("Invalid verification code.");
    }

    // Re-check right before account creation: a second admin signup could
    // have been initiated concurrently and reach this point at nearly the
    // same time as the first.
    if (role === "ADMIN" && (await this.authRepository.adminExists())) {
      await this.authRepository.deletePendingRegistration(data.email, role);
      throw new Error(ADMIN_ALREADY_EXISTS_MESSAGE);
    }

    let user;
    try {
      user = await this.authRepository.createUser({
        fullName: pending.fullName,
        email: pending.email,
        password: pending.passwordHash,
        role,
      });
    } catch (error) {
      // Final backstop: the partial unique index on User.role (ADMIN only)
      // rejects a second admin row even if both checks above raced.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error(role === "ADMIN" ? ADMIN_ALREADY_EXISTS_MESSAGE : "Email already exists");
      }
      throw error;
    }

    await this.authRepository.markEmailVerified(user.id);
    await this.authRepository.deletePendingRegistration(data.email, role);

    return this.toPublicUser(user);
  }

  async resendOtp(data: ResendOtpInput, role: Role) {
    const pending = await this.authRepository.findPendingRegistrationByEmail(data.email, role);
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

    await this.authRepository.touchPendingRegistrationOtp(data.email, role, {
      otpHash,
      otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    });

    await sendOtpEmail(pending.email, pending.fullName, otp);
  }

  // Forgot / reset password. Errors never reveal whether an email exists.
  async forgotPassword(data: ForgotPasswordInput, role: Role) {
    const user = await this.authRepository.findUserByEmail(data.email, role);
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
    const resetPath = role === "ADMIN" ? "/admin/auth/reset-password" : "/auth/reset-password";
    const resetUrl = `${frontendUrl}${resetPath}?token=${rawToken}`;

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

