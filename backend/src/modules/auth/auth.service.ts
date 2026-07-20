// import { randomUUID } from "node:crypto";

// import { AppError } from "../../core/errors/app-error";
// import { hashPassword, verifyPassword } from "../../core/security/password";
// import type { AppRepositories } from "../../infrastructure/persistence/repositories";
// import { toPublicUser, type StoredUser, type User, type UserRole } from "../../shared/domain";
// import type { LoginInput, RegistrationInput } from "./auth.schemas";

// export class AuthService {
//   constructor(private readonly repositories: AppRepositories) {}

//   async register(input: RegistrationInput, role: UserRole): Promise<User> {
//     const existing = await this.repositories.users.findByEmail(input.email);
//     if (existing) {
//       throw AppError.conflict("An account with this email already exists.");
//     }

//     const now = new Date().toISOString();
//     const user: StoredUser = {
//       id: randomUUID(),
//       name: input.name,
//       email: input.email,
//       role,
//       passwordHash: await hashPassword(input.password),
//       createdAt: now,
//     };

//     await this.repositories.users.create(user);
//     return toPublicUser(user);
//   }

//   async login(input: LoginInput, role: UserRole): Promise<User> {
//     const user = await this.repositories.users.findByEmail(input.email);
//     const passwordMatches = user ? await verifyPassword(input.password, user.passwordHash) : false;

//     if (!user || user.role !== role || !passwordMatches) {
//       throw AppError.unauthorized("Invalid email or password.");
//     }

//     return toPublicUser(user);
//   }

//   async getUser(userId: string): Promise<User> {
//     const user = await this.repositories.users.findById(userId);
//     if (!user) {
//       throw AppError.unauthorized("The authenticated account no longer exists.");
//     }

//     return toPublicUser(user);
//   }
// }
import bcrypt from "bcrypt";
import type { Role } from "@prisma/client";
import { AuthRepository } from "./auth.repository";
import type { LoginInput, RegisterInput, UpdateProfileInput } from "./auth.schemas";

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

