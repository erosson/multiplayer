import * as F from "./figure";
import * as N from "./node";

export interface Collide {
  /**
   * Nodes have distance 0, and should be merged
   */
  intersects: [N.Node, N.Node][];
  /**
   * Node ids that we'll keep
   */
  unique: Set<N.ID>;
  /**
   * Intersecting node ids that we'll remove
   */
  removed: Set<N.ID>;
  /**
   * Nodes have distance 1, and should have a unit edge. Includes duplicates with intersecting nodes
   */
  intersectingEdges: [N.Node, N.Node][];
  /**
   * unit edges that don't interact with removed duplicate nodes
   */
  uniqueEdges: [N.Node, N.Node][];
  /**
   * Updated figure
   */
  fig: F.Figure;
}

interface XY {
  x: number;
  y: number;
}

export function collide(fig0: N.Node[]): Collide {
  const accum = fig0.reduce(
    (accumA, a, indexA) => {
      if (accumA.removed.has(a.id)) {
        return accumA;
      }
      accumA.unique.add(a.id);
      const axy = N.toXY(a.coords);
      return fig0.slice(indexA + 1).reduce((accum, b) => {
        const bxy = N.toXY(b.coords);
        const d = distance(axy, bxy);
        if (Math.abs(d) < tolerance) {
          accum.intersects.push([a, b]);
          accum.removed.add(b.id);
        } else if (Math.abs(d - 1) < tolerance) {
          accum.intersectingEdges.push([a, b]);
        }
        return accum;
      }, accumA);
    },
    {
      intersects: [],
      removed: new Set(),
      unique: new Set(),
      intersectingEdges: [],
    } as Pick<
      Collide,
      "intersects" | "removed" | "unique" | "intersectingEdges"
    >
  );
  const uniqueEdges = accum.intersectingEdges.filter(
    ([a, b]) => !accum.removed.has(a.id) && !accum.removed.has(b.id)
  );
  const fig = {
    nodes: fig0.filter((n) => !accum.removed.has(n.id)),
    edges: uniqueEdges.map(([a, b]) => [a.id, b.id] as [N.ID, N.ID]),
  };
  return { ...accum, uniqueEdges, fig };
}

const tolerance = 0.0000000000001;

function distance(axy: XY, bxy: XY): number {
  const dx = axy.x - bxy.x;
  const dy = axy.y - bxy.y;
  return Math.sqrt(dx * dx + dy * dy);
}
