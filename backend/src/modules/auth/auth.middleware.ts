import { FastifyReply, FastifyRequest } from "fastify";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({
      success: false,
      message: "Unauthorized",
    });
  }
}



export function authorize(...roles: string[]) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const user = request.user as {
      id: string;
      email: string;
      role: string;
    };

    if (!roles.includes(user.role)) {
      return reply.status(403).send({
        success: false,
        message: "Forbidden",
      });
    }
  };
}