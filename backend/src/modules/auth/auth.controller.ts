import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";
import { RegisterInput, LoginInput  } from "./auth.schemas";

export class AuthController {
  private authService = new AuthService();

  async register(
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply
  ) {
    try {
      const user = await this.authService.register(request.body);

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
  reply: FastifyReply
) {
    try {
      const user = await this.authService.login(request.body);

      const token = await reply.jwtSign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

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
      return reply.send({
        success: true,
        user: request.user,
      });
    }
}