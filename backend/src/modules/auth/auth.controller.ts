import { FastifyReply, FastifyRequest } from "fastify";
import type { Role } from "@prisma/client";
import { AuthService } from "./auth.service";
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

type AuthTokenPayload = {
  id: string;
  email: string;
  role: Role;
};

export class AuthController {
  private authService = new AuthService();

  private issueToken(
    reply: FastifyReply,
    user: { id: string; email: string; role: Role }
  ) {
    return reply.jwtSign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" }
    );
  }

  async registerInitiate(
    request: FastifyRequest<{ Body: RegisterInitiateInput }>,
    reply: FastifyReply
  ) {
    try {
      await this.authService.registerInitiate(request.body);
      return reply.status(200).send({
        success: true,
        message: "A verification code has been sent to your email.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      const status = message === "Email already exists" ? 409 : 400;
      return reply.status(status).send({ success: false, message });
    }
  }

  async registerVerify(
    request: FastifyRequest<{ Body: RegisterVerifyInput }>,
    reply: FastifyReply
  ) {
    try {
      const user = await this.authService.registerVerify(request.body);
      const token = await this.issueToken(reply, user);

      return reply.status(201).send({
        success: true,
        message: "Email verified. Your account has been created.",
        token,
        user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      return reply.status(400).send({ success: false, message });
    }
  }

  async resendOtp(
    request: FastifyRequest<{ Body: ResendOtpInput }>,
    reply: FastifyReply
  ) {
    try {
      await this.authService.resendOtp(request.body);
      return reply.status(200).send({
        success: true,
        message: "A new verification code has been sent to your email.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      const status = message.startsWith("Please wait") ? 429 : 400;
      return reply.status(status).send({ success: false, message });
    }
  }

  async forgotPassword(
    request: FastifyRequest<{ Body: ForgotPasswordInput }>,
    reply: FastifyReply
  ) {
    try {
      await this.authService.forgotPassword(request.body);
    } catch {
      // Fall through: never reveal backend failures tied to a specific email.
    }

    return reply.status(200).send({
      success: true,
      message: "If an account exists for that email, a password reset link has been sent.",
    });
  }

  async resetPassword(
    request: FastifyRequest<{ Body: ResetPasswordInput }>,
    reply: FastifyReply
  ) {
    try {
      await this.authService.resetPassword(request.body);
      return reply.status(200).send({
        success: true,
        message: "Password updated successfully.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      return reply.status(400).send({ success: false, message });
    }
  }

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
      const token = await this.issueToken(reply, user);

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
