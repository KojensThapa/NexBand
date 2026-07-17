import { prisma } from "../../config/prisma";
import { RegisterInput } from "./auth.schemas";

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async createUser(data: RegisterInput & { password: string }) {
    return prisma.user.create({
      data,
    });
  }
}