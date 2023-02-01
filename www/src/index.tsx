import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import Hello from "./hello";
import Count from "./count";
import Platform from "./platform";
import Swarm from "./swarm";
import Swarm2 from "./swarm2";
import SwarmGraph from "./swarm-graph";
import Nav from "./nav";
import * as Route from "./route";
import * as Env from "./env";

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
          path: Route.Route.swarm2,
          element: <Swarm2 />,
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
