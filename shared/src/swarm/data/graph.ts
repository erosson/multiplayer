import * as G from "graphology";
import { AbstractGraph } from "graphology-types";
import { Unit, Prod } from "../schema";
import units from "./unit";
import * as ID from "./id";
import { product } from "../util/math";
import { singleSource, edgePathFromNodePath } from "graphology-shortest-path";
import { Production, ProductionUnit } from "../production";

export interface ProducerGraph {
  all: AbstractGraph<Unit, Edge>;
  childPaths: Record<ID.Unit, ProducerPath[]>;
}

export interface Edge {
  producer: Unit;
  child: Unit;
  prod: Prod;
}

export interface ProducerPath {
  producer: Unit;
  child: Unit;
  path: Edge[];
}

export function producer(): ProducerGraph {
  const all: AbstractGraph<Unit, Edge> = new G.DirectedGraph({
    type: "directed",
    allowSelfLoops: false,
    multi: false,
  });
  for (let u of units) {
    all.addNode(u.id, u);
  }
  for (let child of units) {
    for (let prod of child.prod ?? []) {
      const producer = all.getNodeAttributes(prod.unit);
      // producer -> child
      all.addDirectedEdge(prod.unit, child.id, { producer, child, prod });
    }
  }
  const childPaths = Object.fromEntries(
    all.mapNodes((childId: string) => {
      const nodePaths = singleSource(all, childId);
      delete nodePaths[childId]; // ignore path between a node and itself
      const prodPaths = Object.entries(nodePaths).map(
        ([producerId, nodePath]): ProducerPath => {
          const path = edgePathFromNodePath(all, nodePath).map((edgeId) =>
            all.getEdgeAttributes(edgeId)
          );
          const producer = all.getNodeAttributes(producerId);
          const child = all.getNodeAttributes(childId);
          return { producer, child, path };
        }
      );
      return [childId, prodPaths];
    })
  ) as Record<ID.Unit, ProducerPath[]>;
  return { all, childPaths };
}
