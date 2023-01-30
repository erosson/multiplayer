import Fastify, { FastifyInstance } from "fastify";
import FastifyWebsocket from "@fastify/websocket";
import FastifyCookie from "@fastify/cookie";
import * as Session from "./session.js";
import * as Hello from "./hello.js";
import * as Count from "./count.js";
import * as Platform from "./platform.js";
import * as Env from "./env.js";

async function main() {
  const env = await Env.get();
  const app: FastifyInstance = Fastify.default({ logger: false });
  app.register(FastifyCookie, {
    secret: env.COOKIE_SECRET,
  });
  app.register(FastifyWebsocket.default);
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
    fastify.get("/platform", { websocket: true }, Platform.createHandler());
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
