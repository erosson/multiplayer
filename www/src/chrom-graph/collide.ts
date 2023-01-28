import * as F from "./figure";
import * as N from "./node";
import { quadtree } from "d3-quadtree";

interface CollideBuilder {
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
}

export interface Collide extends CollideBuilder {
  /**
   * unit edges that don't interact with removed duplicate nodes
   */
  uniqueEdges: [N.Node, N.Node][];
  /**
   * Updated figure
   */
  fig: N.Figure;
}
function emptyBuilder(): CollideBuilder {
  return {
    intersects: [],
    removed: new Set(),
    unique: new Set(),
    intersectingEdges: [],
  };
}

interface XY {
  x: number;
  y: number;
}

/**
 * A simple no-dependencies, no-partitioning collision detector. O(n^2) time.
 */
function collideNaive(fig0: N.Node[]): CollideBuilder {
  return fig0.reduce((accumA, a, indexA) => {
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
  }, emptyBuilder());
}

type NodeXY = { x: number; y: number; node: N.Node };
function findPred(bb: NodeXY, a: NodeXY, ignored: Set<N.ID>) {
  return (
    // don't visit the same node
    a.node.id !== bb.node.id &&
    // don't visit nodes twice, out of order
    a.node.id < bb.node.id &&
    // don't visit ignored nodes
    !ignored.has(bb.node.id)
  );
}
function collideQuadtree(fig0: N.Node[]): CollideBuilder {
  const xys: NodeXY[] = fig0.map((node) => ({ ...N.toXY(node.coords), node }));
  let qt = quadtree(
    xys,
    (n) => n.x,
    (n) => n.y
  );
  const builder = emptyBuilder();
  for (let a of qt.data()) {
    if (!builder.removed.has(a.node.id)) {
      builder.unique.add(a.node.id);
      let b: NodeXY | undefined;
      while (
        // we're using a patch that adds find-filter support - but it has no types, so types here are awkward
        // https://github.com/d3/d3-quadtree/pull/28/files
        (b = (qt.find as any)(a.x, a.y, tolerance, (bb: NodeXY) =>
          findPred(bb, a, builder.removed)
        ))
      ) {
        builder.removed.add(b.node.id);
      }
    }
  }
  // actually remove the removed nodes before building edges
  qt = quadtree(
    xys.filter((xy) => !builder.removed.has(xy.node.id)),
    qt.x(),
    qt.y()
  );
  for (let a of qt.data()) {
    const visited = new Set<N.ID>();
    let b: NodeXY;
    while (
      (b = (qt.find as any)(a.x, a.y, 1 - tolerance, (bb: NodeXY) =>
        findPred(bb, a, visited)
      ))
    ) {
      // ignore nodes that are too close
      visited.add(b.node.id);
    }
    while (
      (b = (qt.find as any)(a.x, a.y, 1 + tolerance, (bb: NodeXY) =>
        findPred(bb, a, visited)
      ))
    ) {
      // add an edge for nodes that are just the right distance, and ignore them on future visits
      builder.intersectingEdges.push([a.node, b.node]);
      visited.add(b.node.id);
    }
  }
  // console.log(builder.removed.size, builder.removed);
  return builder;
}

type BuildMode = "quadtree" | "naive";
function collideBuild(fig0: N.Node[], mode: BuildMode): CollideBuilder {
  switch (mode) {
    case "quadtree":
      return collideQuadtree(fig0);
    case "naive":
      return collideNaive(fig0);
  }
}

// Quadtree made our time worse. Ugh. I'm sure it's my implementation...
// export function collide(fig0: N.Node[], mode: BuildMode = "quadtree"): Collide {
export function collide(fig0: N.Node[], mode: BuildMode = "naive"): Collide {
  const accum = collideBuild(fig0, mode);
  const uniqueEdges = accum.intersectingEdges.filter(
    ([a, b]) => !accum.removed.has(a.id) && !accum.removed.has(b.id)
  );
  const fig = {
    nodes: fig0.filter((n) => !accum.removed.has(n.id)),
    edges: uniqueEdges.map(([a, b]) => [a.id, b.id] as [N.ID, N.ID]),
  };
  return { ...accum, uniqueEdges, fig };
}

const tolerance = 1e-13;

export function distance(axy: XY, bxy: XY = { x: 0, y: 0 }): number {
  const dx = axy.x - bxy.x;
  const dy = axy.y - bxy.y;
  return Math.sqrt(dx * dx + dy * dy);
}
