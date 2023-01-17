import React from "react";
import * as Proto from "shared/dist/count";
import { Duration } from "shared/dist/google/protobuf/duration";
import * as Game from "shared/src/count/count";

function send(ws: WebSocket, input: Proto.Input): void {
  ws.send(Proto.Input.toJsonString(input));
}
export default function Count(props: { server: string }): JSX.Element {
  const { state, ws, error } = useSocket(props.server);
  return state && ws ? (
    <div>
      <h1>count</h1>
      <div>{`${state.elapsed?.seconds}.${state.elapsed?.nanos}`}</div>
      <div>
        <button onClick={() => send(ws, Game.input.decr())}>-</button>
        {state.value}
        <button onClick={() => send(ws, Game.input.incr())}>+</button>
      </div>
    </div>
  ) : error ? (
    <pre>{error.message}</pre>
  ) : (
    <div>loading...</div>
  );
}

function useSocket(server: string) {
  const [error, setError] = React.useState<null | Error>(null);
  const [auth, setAuth] = React.useState<null | unknown>(null);
  const [ws, setWs] = React.useState<null | WebSocket>(null);
  const [state, setState] = React.useState<null | Proto.State>(null);

  React.useEffect(() => {
    const url = `${server}/auth/guest`;
    // sets httpOnly session cookie
    fetch(url, { credentials: "include" }).then(setAuth, setError);
  }, []);

  React.useEffect(() => {
    if (!auth) return;
    const url = `${server.replace(/^http/, "ws")}/count`;
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
        setState((state) => Game.updateClient(state as Proto.State, action));
      } catch (e) {
        console.error(e);
      }
    };
    return () => ws.close();
  }, [auth]);

  return { state, auth, ws, error };
}
