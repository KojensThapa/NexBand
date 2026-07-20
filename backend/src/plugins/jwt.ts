// 
import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";

export default fp(async function (fastify) {
  const secret = process.env.JWT_SECRET ?? "development-only-secret-change-before-production";

  if (process.env.NODE_ENV === "production" && secret.startsWith("development-only")) {
    throw new Error("Set a unique JWT_SECRET before starting the production API.");
  }

  fastify.register(fastifyJwt, {
    secret,
  });
});
