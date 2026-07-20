import { FastifyReply, FastifyRequest } from "fastify";
import type { Role } from "@prisma/client";
import { AuthService } from "./auth.service";
import type { RegisterInput, LoginInput, UpdateProfileInput } from "./auth.schemas";

type AuthTokenPayload = {
  id: string;
  email: string;
  role: Role;
};

export class AuthController {
  private authService = new AuthService();

  async register(
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply,
    role: Role
  ) {
    try {
      const user = await this.authService.register(request.body, role);

      return reply.status(201).send({
        success: true,
        message: "User registered successfully",
        data: user,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal Server Error";

      return reply.status(400).send({
        success: false,
        message,
      });
    }
  }

  async login(
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply,
    role: Role
  ) {
    try {
      const user = await this.authService.login(request.body, role);

      const token = await reply.jwtSign({
        id: user.id,
        email: user.email,
        role: user.role,
      }, { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" });

      return reply.status(200).send({
        success: true,
        message: "Login successful",
        token,
        user,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal Server Error";

      return reply.status(401).send({
        success: false,
        message,
      });
    }
  }

  async me(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const user = await this.authService.getUser((request.user as AuthTokenPayload).id);
      return reply.send({
        success: true,
        data: user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      return reply.status(401).send({ success: false, message });
    }
  }

  async updateProfile(
    request: FastifyRequest<{ Body: UpdateProfileInput }>,
    reply: FastifyReply
  ) {
    try {
      const user = await this.authService.updateProfile(
        (request.user as AuthTokenPayload).id,
        request.body
      );
      return reply.send({ success: true, data: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      return reply.status(400).send({ success: false, message });
    }
  }

  async deleteAccount(request: FastifyRequest, reply: FastifyReply) {
    try {
      await this.authService.deleteAccount((request.user as AuthTokenPayload).id);
      return reply.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      return reply.status(400).send({ success: false, message });
    }
  }
}
