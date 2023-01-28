import React from "react";
// import * as GT from "graphology-types";
import * as G from "graphology";
// import * as C from "graphology-canvas";
import * as C from "sigma";
import * as CT from "sigma/types";
// import * as GL from "graphology-layout";
import * as N from "./node";
import * as F from "./figure";
import * as Collide from "./collide";
import * as Route from "../route";
import { Link, useParams } from "react-router-dom";
// import forceAtlas2 from "graphology-layout-forceatlas2";

const style = {
  canvas: {
    border: "1px solid red",
    borderRadius: "0.5em",
    width: "90vw",
    height: "90vh",
  },
};

function empty(): G.default {
  return new G.UndirectedGraph<
    Partial<CT.NodeDisplayData>,
    Partial<CT.EdgeDisplayData>
  >({
    allowSelfLoops: false,
    multi: false,
    type: "undirected",
  });
}

function renderNode(node: N.Node): Partial<CT.NodeDisplayData> {
  const xy = N.toXY(node.coords);
  return {
    color: node.color ?? "black",
    label: node.label
      ? `${node.label} (${node.id})@${JSON.stringify(xy)}`
      : `${node.id}@${JSON.stringify(xy)}`,
    size: 5,
    ...xy,
  };
}

function toGraph(d: F.Figure): G.default {
  const g = empty();
  for (let node of d.nodes) {
    g.addNode(node.id, renderNode(node));
  }
  for (let [a, b] of d.edges) {
    g.addEdge(a, b);
  }
  return g;
}

function loadFigure(figure: string | undefined): N.Node[] {
  switch (figure) {
    case "figure1":
      return F.figure1("figure1");
    case "figure2":
      return F.figure2("figure2");
    case "figure4":
      return F.figure4("figure4");
    case "figure5":
      return F.figure5("figure5");
    case "figure7a":
      return F.figure7a("figure7a");
    case "figure7b":
      return F.figure7b("figure7b");
    default:
      return F.figure5("figure5");
  }
}

export default function ChromaticGraph(): JSX.Element {
  const params = useParams();
  const fig0 = loadFigure(params.figure);
  const collide = Collide.collide(fig0);
  const graph = toGraph(collide.fig);
  const canvas = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (canvas.current) {
      const render = new C.Sigma(graph, canvas.current, {});
      return () => render.kill();
    }
  }, [canvas, graph]);
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to={Route.chromGraph("figure1")}>figure 1</Link>
          </li>
          <li>
            <Link to={Route.chromGraph("figure2")}>figure 2</Link>
          </li>
          <li>
            <Link to={Route.chromGraph("figure4")}>figure 4</Link>
          </li>
          <li>
            <Link to={Route.chromGraph("figure5")}>figure 5</Link>
          </li>
          <li>
            <Link to={Route.chromGraph("figure7a")}>
              figure 7a (moser spindle)
            </Link>
          </li>
          <li>
            <Link to={Route.chromGraph("figure7b")}>figure 7b</Link>
          </li>
        </ul>
      </nav>
      <ul>
        <li>
          {collide.fig.nodes.length} nodes ({fig0.length} generated nodes;{" "}
          {collide.removed.size} collisions removed)
        </li>
        <li>
          {collide.fig.edges.length} unit edges (
          {collide.intersectingEdges.length} generated edges;{" "}
          {collide.intersectingEdges.length - collide.fig.edges.length}{" "}
          collisions removed)
        </li>
      </ul>
      <div style={style.canvas} ref={canvas}></div>
    </div>
  );
}
