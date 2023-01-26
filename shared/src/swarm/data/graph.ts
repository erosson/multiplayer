import * as G from "graphology";
import { AbstractGraph } from "graphology-types";
import { Unit, Prod, AnyID, UnitID } from "../schema";
import units from "./unit";
import { singleSource, edgePathFromNodePath } from "graphology-shortest-path";

export interface ProducerGraph<I extends AnyID> {
  all: AbstractGraph<Unit<I>, Edge<I>>;
  childPaths: Record<UnitID<I>, ProducerPath<I>[]>;
}

export interface Edge<I extends AnyID> {
  producer: Unit<I>;
  child: Unit<I>;
  prod: Prod<I>;
}

export interface ProducerPath<I extends AnyID> {
  producer: Unit<I>;
  child: Unit<I>;
  path: Edge<I>[];
}

export function producer() {
  return baseProducer(units);
}
export function baseProducer<I extends AnyID>(
  units: readonly UnitID<I>[]
): ProducerGraph<I> {
  const all: AbstractGraph<Unit<I>, Edge<I>> = new G.DirectedGraph({
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
        ([producerId, nodePath]): ProducerPath<I> => {
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
  ) as Record<UnitID<I>, ProducerPath<I>[]>;
  return { all, childPaths };
}
