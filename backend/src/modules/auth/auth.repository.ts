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
}
