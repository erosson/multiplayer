import Fastify, { FastifyRequest, FastifyInstance } from "fastify";
import FastifyWebsocket, { SocketStream } from "@fastify/websocket";
import FastifyCookie from "@fastify/cookie";
import * as Session from "./session";
import * as Hello from "./hello";
import * as Count from "./count";
import "shared";

const app: FastifyInstance = Fastify({ logger: false });
app.register(FastifyCookie, {
  // TODO productionify
  secret: "test-secret-abc123",
});
app.register(FastifyWebsocket);
// https://stackoverflow.com/a/74131067/2782048
app.addHook("preHandler", (req, res, done) => {
  const allowedPaths = new Set(["/auth/guest"]);
  if (allowedPaths.has(req.routerPath)) {
    // TODO productionify
    const origin = `${process.env.GITPOD_WORKSPACE_URL?.replace(
      "https://",
      "https://8080-"
    )}`;
    res.header("Access-Control-Allow-Origin", origin);
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
  fastify.get("/auth/guest", Session.ensure);
});

app.register(async function (fastify) {
  fastify.get("/hello", { websocket: true }, Hello.handler);
  fastify.get("/count", { websocket: true }, Count.createHandler());
});

app.listen({ port: 3000 }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
