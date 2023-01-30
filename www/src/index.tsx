import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import Hello from "./hello.js";
import Count from "./count.js";
import Platform from "./platform.js";
import Swarm from "./swarm.js";
import SwarmGraph from "./swarm-graph.js";
import Nav from "./nav.js";
import * as Route from "./route.js";
import * as Env from "./env.js";

function App(): JSX.Element {
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
    <Router env={env} />
  ) : error ? (
    <pre>{error.message}</pre>
  ) : (
    <div>loading...</div>
  );
}
function Layout(props: { children?: React.ReactNode }) {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  );
}
function Router(props: { env: Env.Env }): JSX.Element {
  // https://reactrouter.com/en/main/start/tutorial
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: Route.Route.home,
          element: <>howdy! click a demo link above</>,
        },
        {
          path: Route.Route.hello,
          element: <Hello env={props.env} />,
        },
        {
          path: Route.Route.count,
          element: <Count env={props.env} />,
        },
        {
          path: Route.Route.platform,
          element: <Platform env={props.env} />,
        },
        {
          path: Route.Route.swarm,
          element: <Swarm />,
        },
        {
          path: Route.Route.swarmGraph,
          element: <SwarmGraph />,
        },
      ],
    },
  ]);

  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

async function main() {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("no root");
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
}

main();
