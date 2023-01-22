import Fastify, { FastifyRequest, FastifyInstance } from "fastify";
import FastifyWebsocket, { SocketStream } from "@fastify/websocket";
import FastifyCookie from "@fastify/cookie";
import * as Session from "./session";
import * as Hello from "./hello";
import * as Count from "./count";
import "shared";
import * as Env from "./env";

async function main() {
  const env = await Env.get();
  const app: FastifyInstance = Fastify({ logger: false });
  app.register(FastifyCookie, {
    secret: env.COOKIE_SECRET,
  });
  app.register(FastifyWebsocket);
  // https://stackoverflow.com/a/74131067/2782048
  app.addHook("preHandler", (req, res, done) => {
    const allowedPaths = new Set(["/auth/guest"]);
    if (allowedPaths.has(req.routerPath)) {
      res.header("Access-Control-Allow-Origin", env.WWW_URL);
      res.header("Access-Control-Allow-Methods", "GET");
      res.header("Access-Control-Allow-Credentials", true);
    }
    const isPreflight = /options/i.test(req.method);
    if (isPreflight) {
      return res.send();
    }
    done();
  });

  app.register(async function (fastify) {
    fastify.get("/", (req, reply) => {
      reply.send({ hello: "world!?!" });
    });
    fastify.get("/auth/guest", Session.ensure);
    fastify.get("/hello", { websocket: true }, Hello.handler);
    fastify.get("/count", { websocket: true }, Count.createHandler());
  });

  app.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    console.log(`listening on ${address}`);
  });
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
