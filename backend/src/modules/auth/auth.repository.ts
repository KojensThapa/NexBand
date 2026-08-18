import { prisma } from "../../config/prisma";
import type { Role } from "@prisma/client";
import type { RegisterInput, UpdateProfileInput } from "./auth.schemas";

export class AuthRepository {
  // A USER and an ADMIN may share the same email, so lookups must be scoped by role.
  async findUserByEmail(email: string, role: Role) {
    return prisma.user.findUnique({
      where: {
        email_role: { email, role },
      },
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: RegisterInput & { password: string; role: Role }) {
    return prisma.user.create({
      data,
    });
  }

  // Only one ADMIN account may exist system-wide (enforced also by a partial
  // unique index on User.role, see migration 20260818120000_enforce_single_admin).
  async adminExists() {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
    return admin !== null;
  }

  async updateUser(id: string, data: UpdateProfileInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
  }

  async markEmailVerified(id: string) {
    return prisma.user.update({ where: { id }, data: { emailVerified: new Date() } });
  }

  async updatePassword(id: string, password: string) {
    return prisma.user.update({ where: { id }, data: { password } });
  }

  // Pending registration (pre-OTP-verification signup data). Scoped by role so
  // the same email can have an independent pending USER and ADMIN signup.
  async findPendingRegistrationByEmail(email: string, role: Role) {
    return prisma.pendingRegistration.findUnique({ where: { email_role: { email, role } } });
  }

  async upsertPendingRegistration(data: {
    fullName: string;
    email: string;
    role: Role;
    passwordHash: string;
    otpHash: string;
    otpExpiresAt: Date;
  }) {
    return prisma.pendingRegistration.upsert({
      where: { email_role: { email: data.email, role: data.role } },
      create: { ...data, lastSentAt: new Date(), attempts: 0, resendCount: 0 },
      update: {
        fullName: data.fullName,
        passwordHash: data.passwordHash,
        otpHash: data.otpHash,
        otpExpiresAt: data.otpExpiresAt,
        lastSentAt: new Date(),
        attempts: 0,
      },
    });
  }

  async touchPendingRegistrationOtp(
    email: string,
    role: Role,
    data: { otpHash: string; otpExpiresAt: Date }
  ) {
    return prisma.pendingRegistration.update({
      where: { email_role: { email, role } },
      data: {
        otpHash: data.otpHash,
        otpExpiresAt: data.otpExpiresAt,
        lastSentAt: new Date(),
        attempts: 0,
        resendCount: { increment: 1 },
      },
    });
  }

  async incrementPendingRegistrationAttempts(email: string, role: Role) {
    return prisma.pendingRegistration.update({
      where: { email_role: { email, role } },
      data: { attempts: { increment: 1 } },
    });
  }

  async deletePendingRegistration(email: string, role: Role) {
    await prisma.pendingRegistration.deleteMany({ where: { email, role } });
  }

  // Password reset tokens
  async createPasswordResetToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.passwordResetToken.create({ data });
  }

  async findValidPasswordResetTokenByHash(tokenHash: string) {
    const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!token || token.used || token.expiresAt.getTime() <= Date.now()) return null;
    return token;
  }

  async markPasswordResetTokenUsed(id: string) {
    return prisma.passwordResetToken.update({ where: { id }, data: { used: true } });
  }

  async invalidatePasswordResetTokens(userId: string) {
    await prisma.passwordResetToken.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });
  }
}
