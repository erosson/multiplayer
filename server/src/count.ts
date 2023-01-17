import { FastifyRequest } from "fastify";
import { SocketStream } from "@fastify/websocket";
import * as Session from "./session";
import type { WebSocket } from "ws";
import { Duration } from "shared/dist/google/protobuf/duration";
import * as Proto from "shared/dist/count";
import * as Game from "shared/src/count/count";
import { Timestamp } from "shared/dist/google/protobuf/timestamp";

export function createHandler() {
  const server: { [s: Session.Id]: Proto.State } = {};

  function create(): Proto.State {
    return Proto.State.create({
      value: 0,
      elapsed: Duration.create({ seconds: 0n, nanos: 0 }),
      started: Timestamp.fromDate(new Date()),
    });
  }
  function ensure(id: Session.Id): Proto.State {
    if (!(id in server)) {
      server[id] = create();
    }
    return server[id];
  }
  function now(): Timestamp {
    return Timestamp.fromDate(new Date());
  }
  function diff(end: Timestamp, start: Timestamp): Duration {
    // https://developers.google.com/protocol-buffers/docs/reference/java/com/google/protobuf/Duration
    let seconds = end.seconds - start.seconds;
    let nanos = end.nanos - start.nanos;
    if (seconds < 0 && nanos > 0) {
      seconds += 1n;
      nanos -= 1000000000;
    } else if (seconds > 0 && nanos < 0) {
      seconds -= 1n;
      nanos += 1000000000;
    }
    return Duration.create({ seconds, nanos });
  }
  function elapsedNow(st: Proto.State): Duration {
    return diff(now(), st.started as Timestamp);
  }
  function send(socket: WebSocket, action: Proto.Action): void {
    socket.send(Proto.Action.toJsonString(action));
  }
  function onMessage(
    socket: WebSocket,
    fn: (input: Proto.Input) => void
  ): void {
    socket.on("message", (message: Buffer) =>
      fn(Proto.Input.fromJsonString(message.toString()))
    );
  }
  function onOpen(socket: WebSocket, fn: (input: Proto.Input) => void): void {
    socket.on("message", (message: Buffer) =>
      fn(Proto.Input.fromJsonString(message.toString()))
    );
  }

  return function handler(connection: SocketStream, req: FastifyRequest): void {
    const sessionId = Session.getSessionId(req);
    if (!sessionId) {
      console.log("sessionless client rejected");
      connection.end();
      return;
    }
    const socket: WebSocket = connection.socket;

    ensure(sessionId);
    send(socket, Game.action.reset(server[sessionId]));

    onMessage(socket, (input: Proto.Input) => {
      server[sessionId] = Game.updateServer(server[sessionId], input);
      const action: Proto.Action = Proto.Action.create({ action: input.input });
      send(socket, action);
    });

    const interval = setInterval(
      () =>
        send(
          socket,
          Proto.Action.create({
            action: {
              oneofKind: "tick",
              tick: Proto.Tick.create({
                elapsed: elapsedNow(server[sessionId]),
              }),
            },
          })
        ),
      16.5
    );
    socket.on("close", () => {
      clearInterval(interval);
    });
  };
}
