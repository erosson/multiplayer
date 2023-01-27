import React from "react";
// import * as GT from "graphology-types";
import * as G from "graphology";
// import * as C from "graphology-canvas";
import * as C from "sigma";
import * as CT from "sigma/types";
import * as GL from "graphology-layout";
import { range, sum } from "shared/src/swarm/util/math";
import * as Route from "./route";
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

type NodeID = string;
interface Node {
  id: NodeID;
  coords: Coords;
  color?: string;
}
type Edge = [NodeID, NodeID];

type Coords = XY | Polar | Rotation | SumCoords;
type XY = { coords: "xy"; x: number; y: number };
type Polar = { coords: "polar"; r: number; a: Angle };
type SumCoords = { coords: "sum"; cs: Coords[] };
type Rotation = { coords: "rotation"; c: Coords; a: Angle };
function xy(x: number, y: number): XY {
  return { coords: "xy", x, y };
}
function polar(r: number, a: Angle): Polar {
  return { coords: "polar", r, a };
}
function sumCoords(cs: Coords[]): SumCoords {
  return { coords: "sum", cs };
}
function rotation(c: Coords, a: Angle): Rotation {
  return { coords: "rotation", c, a };
}

type Angle = Radians | PiRadians | Degrees;
/**
 * Radians times pi, so we can delay irrational number math
 */
type PiRadians = { angle: "pi-radians"; value: number };
type Radians = { angle: "radians"; value: number };
type Degrees = { angle: "degrees"; value: number };
function piRadians(value: number): PiRadians {
  return { angle: "pi-radians", value };
}
function radians(value: number): Radians {
  return { angle: "radians", value };
}
function degrees(value: number): Degrees {
  return { angle: "degrees", value };
}

function toRadians(a: Angle): number {
  switch (a.angle) {
    case "radians":
      return a.value;
    case "pi-radians":
      return a.value * Math.PI;
    case "degrees":
      return (a.value / 360) * 2 * Math.PI;
  }
}
function toXY(c: Coords): { x: number; y: number } {
  switch (c.coords) {
    case "xy": {
      return { x: c.x, y: c.y };
    }
    case "polar": {
      const rad = toRadians(c.a);
      return { x: c.r * Math.cos(rad), y: c.r * Math.sin(rad) };
    }
    case "rotation": {
      const xy = toXY(c.c);
      const r = Math.sqrt(xy.x * xy.x + xy.y * xy.y);
      const a = radians(Math.atan2(xy.y, xy.x) + toRadians(c.a));
      return toXY(polar(r, a));
    }
    case "sum": {
      const xys = c.cs.map(toXY);
      return { x: sum(xys.map((pt) => pt.x)), y: sum(xys.map((pt) => pt.y)) };
    }
  }
}
function renderNode(node: Node): Partial<CT.NodeDisplayData> {
  return {
    color: node.color ?? "black",
    label: node.id,
    size: 5,
    ...toXY(node.coords),
  };
}
type GraphData = { nodes: Node[]; edges: Edge[] };
function toGraph(d: GraphData): G.default {
  const g = empty();
  for (let node of d.nodes) {
    g.addNode(node.id, renderNode(node));
  }
  for (let [a, b] of d.edges) {
    g.addEdge(a, b);
  }
  return g;
}

enum Color {
  a = "yellow",
  b = "red",
  c = "blue",
  d = "green",
  e = "purple",
  f = "orange",
  g = "pink",
}

// graph constructions from the paper
function figure1(name: string): { nodes: Node[]; edges: Edge[] } {
  const origin = {
    id: `${name}-0`,
    coords: xy(0, 0),
    // color: Color.a
  };
  const orbit = range(6).map((i) => ({
    id: `${name}-${i + 1}`,
    // color: i % 2 === 0 ? Color.b : Color.c,
    coords: polar(1, degrees(60 * i)),
  }));
  const edges: Edge[] = range(orbit.length).flatMap((i) => [
    [origin.id, orbit[i].id],
    [orbit[i].id, orbit[(i + 1) % orbit.length].id],
  ]);
  return { nodes: [origin, ...orbit], edges };
}
function figure2(name: string): { nodes: Node[]; edges: Edge[] } {
  const origin = figure1(`${name}-0`);
  const orbit = range(6).map((i) => {
    const { nodes, edges } = figure1(`${name}-${i + 1}`);
    return {
      edges,
      nodes: nodes.map((n) => ({
        ...n,
        coords: sumCoords([
          n.coords,
          polar(1, degrees(i * 60)),
          polar(1, degrees((i + 1) * 60)),
        ]),
      })),
    };
  });
  // TODO merge overlapping nodes.
  // if, instead of polar coordinates, we identify each node with X and y - but
  // scaled, so a triangle is [(0,0), (2,0), (1,2)] - identifying overlapping
  // nodes happens naturally!
  const edges = [...origin.edges, ...orbit.flatMap((o) => o.edges)];
  const nodes = [...origin.nodes, ...orbit.flatMap((o) => o.nodes)];
  return { nodes, edges };
}
function figure4(name: string): { nodes: Node[]; edges: Edge[] } {
  const a = figure2(`${name}-0`);
  const b0 = figure2(`${name}-1`);
  const b = {
    edges: b0.edges,
    nodes: b0.nodes.map((n) => ({
      ...n,
      coords: rotation(n.coords, radians(2 * Math.asin(1 / 4))),
    })),
  };
  const edges = [...a.edges, ...b.edges];
  const nodes = [...a.nodes, ...b.nodes];
  return { edges, nodes };
}

function loadGraph(figure: string | undefined) {
  switch (figure) {
    case "figure1":
      return figure1("figure1");
    case "figure2":
      return figure2("figure2");
    case "figure4":
      return figure4("figure4");
    default:
      return figure4("figure4");
  }
}

export default function ChromaticGraph(): JSX.Element {
  const params = useParams();
  const graph = toGraph(loadGraph(params.figure));
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
        </ul>
      </nav>
      <div style={style.canvas} ref={canvas}></div>
    </div>
  );
}
