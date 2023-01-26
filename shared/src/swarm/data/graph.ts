import * as G from "graphology";
import { AbstractGraph } from "graphology-types";
import { Unit, Prod } from "../schema";
import units from "./unit";
import * as ID from "./id";
import { product } from "../util/math";
import { singleSource, edgePathFromNodePath } from "graphology-shortest-path";
import { Production, ProductionUnit } from "../production";

interface ProducerGraph {
  all: AbstractGraph<Unit, Edge>;
  childPaths: Record<ID.Unit, ProducerPath[]>;
}

interface Edge {
  producer: Unit;
  child: Unit;
  prod: Prod;
}

interface ProducerPath {
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

export function toProduction(g: ProducerGraph, id: ID.Unit): Production {
  return g.childPaths[id].map((ppath) => toProductionUnit(ppath));
}
function toProductionUnit(ppath: ProducerPath): ProductionUnit {
  const production = product(ppath.path.map((path) => path.prod.value));
  const count = 0; // TODO needs more context!
  return { production, count };
}
export function toProductions(g: ProducerGraph): Record<ID.Unit, Production> {
  return Object.fromEntries(
    ID.units.map((id) => [id, toProduction(g, id)])
  ) as Record<ID.Unit, Production>;
}
