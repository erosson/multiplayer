import React from "react";
import ReactDOM from "react-dom/client";
import Hello from "./hello";
import Count from "./count";
import "shared";

function App(): JSX.Element {
  // TODO productionify this. it works on gitpod
  const server = process.env["SERVER_URL"];
  return (
    <div>
      <Hello server={server} />
      <Count server={server} />
    </div>
  );
}

async function main() {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("no root");
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
}

main();
