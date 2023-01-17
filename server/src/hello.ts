import { FastifyRequest } from "fastify";
import { SocketStream } from "@fastify/websocket";
import * as Session from "./session";
import type { WebSocket } from "ws";

export function handler(connection: SocketStream, req: FastifyRequest): void {
  const socket: WebSocket = connection.socket;
  const id = Session.getSessionId(req);
  if (!id) {
    console.log("sessionless client rejected");
    connection.end();
    return;
  }
  console.log("client connected", id);
  socket.on("message", (message: Buffer) => {
    console.log("client message", message.toString());
    // message.toString() === 'hi from client'
    socket.send(`hi from server ${message.toString()}`);
  });

  const interval = setInterval(
    () => socket.send(JSON.stringify({ type: "tick", now: Date.now() })),
    16.5
  );
  socket.on("close", () => {
    clearInterval(interval);
  });
}
