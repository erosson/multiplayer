import Fastify, {
  FastifyRequest,
  FastifyInstance,
  FastifyReply,
} from "fastify";
import FastifyWebsocket, { SocketStream } from "@fastify/websocket";
import FastifyCookie from "@fastify/cookie";
import { v4 as uuidv4 } from "uuid";
import "shared";

const SESSION_COOKIE_KEY = "session";

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
  fastify.get("/auth/guest", (req: FastifyRequest, res: FastifyReply): void => {
    const opts = {
      path: "/",
      signed: true,
      httpOnly: true,
      secure: true,
    };

    const raw = req.cookies[SESSION_COOKIE_KEY];
    if (raw) {
      const session = req.unsignCookie(raw);
      if (session.valid) {
        const value = session.renew;
        if (session.renew && session.value) {
          res.setCookie(SESSION_COOKIE_KEY, session.value, opts);
          res.send({ status: "RENEW" });
          return;
        } else {
          res.send({ status: "VALID" });
          return;
        }
      }
    }
    res.setCookie(SESSION_COOKIE_KEY, uuidv4(), opts);
    res.send({ status: "CREATED" });
    return;
  });
});
app.register(async function (fastify) {
  fastify.get(
    "/ws",
    { websocket: true },
    (connection: SocketStream, req: FastifyRequest): void => {
      const session = req.cookies[SESSION_COOKIE_KEY];
      if (!session) {
        console.log("sessionless client rejected");
        connection.end();
        return;
      }
      console.log("client connected", session);
      connection.socket.on("message", (message: Buffer) => {
        console.log("client message", message.toString());
        // message.toString() === 'hi from client'
        connection.socket.send(`hi from server ${message.toString()}`);
      });
    }
  );
});

app.listen({ port: 3000 }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
