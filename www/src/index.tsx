import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import Hello from "./hello";
import Count from "./count";
import Platform from "./platform";
import Swarm from "./swarm";
import SwarmGraph from "./swarm/graph";
import SwarmUnit from "./swarm/unit";
import SwarmJson from "./swarm/json";
import * as S from "shared/src/swarm";
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

  const swarmCtx = React.useState(S.Session.empty(S.Data.create()));

  return env ? (
    <Router env={env} swarmCtx={swarmCtx} />
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
function Router(props: {
  env: Env.Env;
  swarmCtx: [
    S.Session.Ctx,
    React.Dispatch<React.SetStateAction<S.Session.Ctx>>
  ];
}): JSX.Element {
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
          element: <Swarm ctx={props.swarmCtx} />,
        },
        {
          path: Route.Route.swarmJson,
          element: <SwarmJson ctx={props.swarmCtx} />,
        },
        {
          path: Route.Route.swarmUnit,
          element: <SwarmUnit ctx={props.swarmCtx} />,
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
