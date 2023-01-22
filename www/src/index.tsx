import React from "react";
import ReactDOM from "react-dom/client";
import Hello from "./hello";
import Count from "./count";
import * as Env from "./env";
import "shared";

function App(): JSX.Element {
  // TODO productionify this. it works on gitpod
  const [env, setEnv] = React.useState<Env.Env | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  React.useEffect(() => {
    Env.get().then(
      (env) => setEnv(env),
      (err) => {
        setError(err);
        console.error(err);
      }
    );
  }, []);
  return env ? (
    <div>
      <Hello env={env} />
      <Count env={env} />
    </div>
  ) : error ? (
    <pre>{error.message}</pre>
  ) : (
    <div>loading...</div>
  );
}

async function main() {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("no root");
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
}

main();
