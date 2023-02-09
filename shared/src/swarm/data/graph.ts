import * as G from "graphology";
import { edgePathFromNodePath, singleSource } from "graphology-shortest-path";
import { AbstractGraph } from "graphology-types";
import { Prod, Unit, UnitID } from "../schema";

export interface ProducerGraph {
  all: AbstractGraph<Unit, Edge>;
  childPaths: Map<UnitID, ProducerPath[]>;
}

export interface Edge {
  producer: Unit;
  child: Unit;
  prod: Prod;
}

/**
 * Production path between two units.
 *
 * examples:
 * - `{producer: drone, child: mineral, path: [[drone,mineral]]}`
 * - `{producer: queen, child: mineral, path: [[queen,drone], [drone,mineral]]}`
 */
export interface ProducerPath {
  producer: Unit;
  child: Unit;
  path: Edge[];
}

export function producer(units: readonly Unit[]): ProducerGraph {
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
  const childPaths = new Map<UnitID, ProducerPath[]>(
    all.mapNodes((childId: string) => {
      const nodePaths = singleSource(all, childId);
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
      return [UnitID.wrap(childId), prodPaths];
    })
  );
  return { all, childPaths };
}
