import React from "react";
import * as Proto from "shared/dist/platform.js";
import { Duration } from "shared/dist/google/protobuf/duration.js";
import { Env } from "./env.js";
import * as Game from "shared/src/platform.js";

function send(ws: WebSocket, input: Proto.Input): void {
  ws.send(Proto.Input.toJsonString(input));
}
const KeyCode = {
  left: "ArrowLeft",
  right: "ArrowRight",
  up: "ArrowUp",
  down: "ArrowDown",
} as const;
function onKey(
  state: Proto.State,
  ws: WebSocket,
  press: "down" | "up",
  local: Proto.ControlState,
  setLocal: (c: Proto.ControlState) => void,
  event: KeyboardEvent
): void {
  const isPressed = press === "down";

  function sendDiff(key: keyof Proto.ControlState) {
    if (!state.control) throw new Error("state.control");
    event.preventDefault();
    if (local[key] !== isPressed) {
      // console.log("key", {
      // key,
      // isPressed,
      // cur: state.control[key],
      // repeat: event.repeat,
      // });
      setLocal({ ...local, [key]: isPressed });
      const ctl = { ...state.control, [key]: isPressed };
      return send(ws, Game.input.control(ctl));
    }
  }
  switch (event.key) {
    case "ArrowLeft":
      return sendDiff("left");
    case KeyCode.right:
      return sendDiff("right");
    case KeyCode.up:
      return sendDiff("up");
    case KeyCode.down:
      return sendDiff("down");
    default:
    // return console.log("missed", event.key);
  }
}
export default function Platform(props: { env: Env }): JSX.Element {
  const { state, ws, error, actionCount, tickCount } = useSocket(props.env);
  const [local, setLocal] = React.useState(Proto.ControlState.create());
  React.useEffect(() => {
    if (!state || !ws) return;
    function keydown(e: KeyboardEvent) {
      if (!state || !ws) return;
      onKey(state, ws, "down", local, setLocal, e);
    }
    function keyup(e: KeyboardEvent) {
      if (!state || !ws) return;
      onKey(state, ws, "up", local, setLocal, e);
    }
    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("keyup", keyup);
    };
  }, [state, ws]);
  return state && ws ? (
    <div>
      <h1>platform</h1>
      <div>{`${state.elapsed?.seconds}.${state.elapsed?.nanos}`}</div>
      <div>
        actions: {actionCount} (+{tickCount} ticks)
      </div>
      <div>{JSON.stringify(state.control)}</div>
      <div>{JSON.stringify(state.location)}</div>
    </div>
  ) : error ? (
    <pre>{error.message}</pre>
  ) : (
    <div>loading...</div>
  );
}

function useSocket(env: Env) {
  const [error, setError] = React.useState<null | Error>(null);
  const [auth, setAuth] = React.useState<null | unknown>(null);
  const [ws, setWs] = React.useState<null | WebSocket>(null);
  const [state, setState] = React.useState<null | Proto.State>(null);
  const [tickCount, setTickCount] = React.useState(0);
  const [actionCount, setActionCount] = React.useState(0);

  React.useEffect(() => {
    const url = `${env.SERVER_URL}/auth/guest`;
    // sets httpOnly session cookie
    fetch(url, { credentials: "include" }).then(setAuth, setError);
  }, []);

  React.useEffect(() => {
    if (!auth) return;
    const url = `${env.SOCKET_URL}/platform`;
    const ws = new WebSocket(url);
    setWs(ws);
    ws.onopen = (ev) => {
      console.log("open");
    };
    ws.onclose = (ev) => {
      console.error("close", ev);
    };
    ws.onerror = (ev) => {
      console.error("error", ev);
    };
    ws.onmessage = (ev) => {
      try {
        const action = Proto.Action.fromJsonString(ev.data);
        if (action.action.oneofKind === "tick") {
          setTickCount((c) => c + 1);
        } else {
          setActionCount((c) => c + 1);
          console.log("action", { action });
        }
        setState((state) => Game.updateClient(state as Proto.State, action));
      } catch (e) {
        console.error(e);
      }
    };
    return () => ws.close();
  }, [auth]);

  return { state, auth, ws, error, actionCount, tickCount };
}
