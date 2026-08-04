import { prisma } from "../../config/prisma";
import type { Role } from "@prisma/client";
import type { RegisterInput, UpdateProfileInput } from "./auth.schemas";

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: {
        email,
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

  // Pending registration (pre-OTP-verification signup data)
  async findPendingRegistrationByEmail(email: string) {
    return prisma.pendingRegistration.findUnique({ where: { email } });
  }

  async upsertPendingRegistration(data: {
    fullName: string;
    email: string;
    passwordHash: string;
    otpHash: string;
    otpExpiresAt: Date;
  }) {
    return prisma.pendingRegistration.upsert({
      where: { email: data.email },
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
    data: { otpHash: string; otpExpiresAt: Date }
  ) {
    return prisma.pendingRegistration.update({
      where: { email },
      data: {
        otpHash: data.otpHash,
        otpExpiresAt: data.otpExpiresAt,
        lastSentAt: new Date(),
        attempts: 0,
        resendCount: { increment: 1 },
      },
    });
  }

  async incrementPendingRegistrationAttempts(email: string) {
    return prisma.pendingRegistration.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
  }

  async deletePendingRegistration(email: string) {
    await prisma.pendingRegistration.deleteMany({ where: { email } });
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
