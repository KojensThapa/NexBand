// 
import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";

export default fp(async function (fastify) {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
  });
});