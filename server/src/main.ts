import Fastify, { FastifyRequest, FastifyInstance } from "fastify";
import { default as FastifyWebsocket, SocketStream } from "@fastify/websocket";
import { default as FastifyCookie } from "@fastify/cookie";
import "shared";

const app: FastifyInstance = Fastify({ logger: true });
app.register(FastifyCookie);
app.register(FastifyWebsocket);
app.register(async function (fastify) {
  fastify.get(
    "/",
    { websocket: true },
    (connection: SocketStream, req: FastifyRequest): void => {
      console.log("client connected");
      req.cookies;
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
