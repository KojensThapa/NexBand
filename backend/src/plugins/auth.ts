// import type { FastifyRequest } from "fastify";

// import { AppError } from "../core/errors/app-error";
// import type { UserRole } from "../shared/domain";

// export interface AccessTokenPayload {
//   sub: string;
//   email: string;
//   role: UserRole;
// }

// declare module "@fastify/jwt" {
//   interface FastifyJWT {
//     payload: AccessTokenPayload;
//     user: AccessTokenPayload;
//   }
// }

// export async function authenticate(request: FastifyRequest): Promise<void> {
//   try {
//     await request.jwtVerify();
//   } catch {
//     throw AppError.unauthorized();
//   }
// }

// export function requireRole(role: UserRole) {
//   return async function verifyRole(request: FastifyRequest): Promise<void> {
//     await authenticate(request);
//     if (request.user.role !== role) {
//       throw AppError.forbidden();
//     }
//   };
// }
