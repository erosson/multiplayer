import React from "react";
import ReactDOM from "react-dom/client";
import "shared";

console.log("Hello World!", React);

type Tick = { type: "tick"; now: number };

function App(): JSX.Element {
  const { state, error } = useSocket();
  const now = useNow();
  const [recent, setRecent] = React.useState<Date[]>([]);
  React.useEffect(() => {
    setRecent((recent) => {
      const head = recent.findIndex((r) => r.getTime() > now.getTime() - 1000);
      return recent.slice(Math.max(0, head - 1)).concat([now]);
    });
  }, [now]);
  const tail = state[state.length - 1] ?? null;
  const [startDiff, setStartDiff] = React.useState<null | number>(null);
  React.useEffect(() => {
    if (now !== null && tail !== null) {
      setStartDiff(now.getTime() - tail.now);
    }
  }, [now, tail]);
  React.useEffect;
  return tail ? (
    <h1>
      Hello, world!
      <div>server messages/sec: {state.length}</div>
      <div>last server message at: {new Date(tail.now ?? 0).toISOString()}</div>
      <div>client frames/sec: {recent.length}</div>
      <div>last client frame at: {now.toISOString()}</div>
      <div>clock diff: {now.getTime() - tail.now - (startDiff ?? 0)}</div>
    </h1>
  ) : error ? (
    <pre>{error.message}</pre>
  ) : (
    <div>loading...</div>
  );
}

function useNow() {
  const [now, setNow] = React.useState(new Date());
  const [closed, setClosed] = React.useState(false);
  function onAnimationFrame() {
    if (!closed) {
      setNow(new Date());
      requestAnimationFrame(onAnimationFrame);
    }
  }
  React.useEffect(() => {
    onAnimationFrame();
    return () => setClosed(true);
  }, []);
  return now;
}

function useSocket() {
  const [error, setError] = React.useState<null | Error>(null);
  const [auth, setAuth] = React.useState<null | unknown>(null);
  const [state, setState] = React.useState<Tick[]>([]);
  const [ws, setWs] = React.useState<null | WebSocket>(null);

  // TODO productionify this. it works on gitpod
  const server = process.env["SERVER_URL"];
  React.useEffect(() => {
    const url = `${server}/auth/guest`;
    // sets httpOnly session cookie
    fetch(url, { credentials: "include" }).then(setAuth, setError);
  }, []);

  React.useEffect(() => {
    if (!auth) return;
    const url = `${server.replace(/^http/, "ws")}/ws`;
    const ws = new WebSocket(url);
    setWs(ws);
    ws.onopen = (ev) => {
      console.log("ws open");
      ws.send("hello from client");
    };
    ws.onclose = (ev) => {
      console.error("close", ev);
    };
    ws.onerror = (ev) => {
      console.error("error", ev);
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        switch (msg.type) {
          case "tick": {
            setState((state) => {
              const head = state.findIndex((r) => r.now > msg.now - 1000);
              return state.slice(Math.max(0, head - 1)).concat([msg]);
            });
            return;
          }
          default:
            return;
        }
      } catch (e) {
        console.error(e);
      }
    };
    return () => ws.close();
  }, [auth]);

  return { state, auth, ws, error };
}

async function main() {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("no root");
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
}

main();
