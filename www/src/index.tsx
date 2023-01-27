import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Hello from "./hello";
import Count from "./count";
import Platform from "./platform";
import Swarm from "./swarm";
import SwarmGraph from "./swarm-graph";
import ChromGraph from "./chrom-graph";
import Nav from "./nav";
import Route from "./route";
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
function Layout(props: { children?: React.ReactNode }): JSX.Element {
  return (
    <>
      <Nav />
      {props.children}
    </>
  );
}
function Router(props: { env: Env.Env }): JSX.Element {
  // https://reactrouter.com/en/main/start/tutorial
  const router = createBrowserRouter([
    {
      path: Route.home,
      element: <Layout>howdy! click a demo link above</Layout>,
    },
    {
      path: Route.hello,
      element: (
        <Layout>
          <Hello env={props.env} />
        </Layout>
      ),
    },
    {
      path: Route.count,
      element: (
        <Layout>
          <Count env={props.env} />
        </Layout>
      ),
    },
    {
      path: Route.platform,
      element: (
        <Layout>
          <Platform env={props.env} />
        </Layout>
      ),
    },
    {
      path: Route.swarm,
      element: (
        <Layout>
          <Swarm />
        </Layout>
      ),
    },
    {
      path: Route.swarmGraph,
      element: (
        <Layout>
          <SwarmGraph />
        </Layout>
      ),
    },
    {
      path: Route.chromGraph,
      element: (
        <Layout>
          <ChromGraph />
        </Layout>
      ),
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
