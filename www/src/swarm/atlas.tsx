import React from "react";
import * as S from "shared/src/swarm";
// import "graphology-types";
import * as G from "graphology";
// import * as C from "graphology-canvas";
import * as C from "sigma";
import * as CT from "sigma/types";
import * as GL from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import {
  padStart,
  range,
  repeat,
  sortBy,
  times,
  uniq,
  uniqBy,
  zip,
} from "lodash";
import { UseReducerT } from "../util";
import { Settings } from "sigma/settings";
import { Attributes } from "graphology-types";
import { useNavigate, useParams } from "react-router-dom";
import * as Route from "../route";
import { SigmaNodeEventPayload, SigmaStageEventPayload } from "sigma/sigma";

const style = {
  canvas: {
    border: "1px solid red",
    borderRadius: "0.5em",
    width: "400px",
    height: "400px",
  },
};
const nodeCountPerLevel = [1, 4, 6, 8, 8, 10];
function pad0(n: number, l: number = 3): string {
  return padStart(`${n}`, l, "0");
}
interface Node {
  id: string;
  level: number;
  n: number;
  x: number;
  y: number;
  theta: number;
}
const nodesByLevel: Node[][] = nodeCountPerLevel.map((n, level) =>
  range(n).map((i) => {
    const theta = (Math.PI * 2 * i) / n;
    const x = Math.cos(theta) * level;
    const y = Math.sin(theta) * level;
    return { id: `${pad0(level)}:${pad0(i)}`, level, n: i, theta, x, y };
  })
);
// console.log(nodesByLevel);
function zipShort<A, B>(a: A[], b: B[]): [A, B][] {
  return zip(a, b).slice(0, Math.min(a.length, b.length)) as [A, B][];
}
const crossLevelEdgesByLevel: [Node, Node][][] = zipShort(
  nodesByLevel,
  nodesByLevel.slice(1)
).map(([lower0, upper0], level) => {
  const [shorter, longer] =
    lower0.length < upper0.length ? [lower0, upper0] : [upper0, lower0];
  const ret = longer.flatMap((nl) => {
    // every node is connected to the closest n nodes on the next level
    const byDistance: Node[] = sortBy(shorter, (ns) => distanceSquared(ns, nl));
    return byDistance.slice(0, 2).map((ns) => [nl, ns] as [Node, Node]);
  });
  // console.log("crosslevel", level, ret);
  return ret;
});
function distanceSquared(a: Node, b: Node): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}
const sameLevelEdgesByLevel: [Node, Node][][] = nodesByLevel.map((nodes0) => {
  if (nodes0.length <= 1) return [];
  const nodes = [...nodes0, ...nodes0];
  return zipShort(nodes0, nodes.slice(1));
});
// console.log("samelevel", sameLevelEdgesByLevel);
const edges: [Node, Node][] = [
  ...crossLevelEdgesByLevel.flat(),
  ...sameLevelEdgesByLevel.flat(),
];
// console.log("all edges", edges);

interface NodeAttrs extends Partial<Settings & Attributes> {
  node: Node;
}
const selectedNode = { size: 5, color: "red" };
const unselectedNode = { size: 3, color: null };
export default function SwarmProduction(props: {
  ctx: UseReducerT<S.Session.Ctx, S.Session.T.Action>;
}): JSX.Element {
  const selected: string | null = useParams().nodeId ?? null;
  const [graph] = React.useState<G.default>(() => {
    const g = new G.UndirectedGraph<NodeAttrs>({
      allowSelfLoops: true,
      multi: false,
      type: "undirected",
    });
    for (let ns of nodesByLevel) {
      for (let n of ns) {
        g.addNode(n.id, {
          node: n,
          x: n.x,
          y: n.y,
          label: n.id,
          ...(n.id === selected ? selectedNode : unselectedNode),
        });
      }
    }
    for (let [e1, e2] of edges) {
      g.addEdge(e1.id, e2.id);
    }
    // GL.circular.assign(g, { scale: 1 });
    // forceAtlas2.assign(g, { iterations: 50 });
    return g;
  });

  const canvas = React.useRef<HTMLDivElement | null>(null);
  const nav = useNavigate();
  const [render, setRender] = React.useState<C.Sigma | null>(null);
  React.useEffect(() => {
    if (canvas.current && graph) {
      const render = new C.Sigma(graph, canvas.current, {});
      setRender(render);
      return () => render.kill();
    }
  }, [canvas, graph]);
  React.useEffect(() => {
    if (!render) return;
    function clickNode(e: SigmaNodeEventPayload) {
      const node: Node = graph.getNodeAttributes(e.node).node;
      if (selected) {
        graph.mergeNodeAttributes(selected, unselectedNode);
      }
      graph.mergeNodeAttributes(node.id, selectedNode);
      // setSelected(node.id);
      nav(Route.swarmAtlas(node.id));
    }
    function clickStage(e: SigmaStageEventPayload) {
      if (selected) {
        graph.mergeNodeAttributes(selected, unselectedNode);
      }
      nav(Route.swarmAtlas());
    }
    render.addListener("clickNode", clickNode);
    render.addListener("clickStage", clickStage);
    return () => {
      render.removeListener("clickNode", clickNode);
      render.removeListener("clickStage", clickStage);
    };
  }, [render, selected]);
  return (
    <div>
      <div style={style.canvas} ref={canvas}></div>
    </div>
  );
}
