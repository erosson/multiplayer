import {
  Node,
  Edge,
  xy,
  polar,
  degrees,
  sumCoords,
  rotate,
  translate,
  radians,
  rotateAbout,
  negate,
  piRadians,
  toRadians,
  toXY,
  mapCoords,
  negateAngle,
  Angle,
  recenter,
  Coords,
  scaleAngle,
} from "./node";
import { range, sum } from "shared/src/swarm/util/math";
import { distance } from "./collide";
import { flow, pipe } from "fp-ts/lib/function";
import * as C from "./collide";
import { keyBy } from "shared/src/swarm/util/schema";

export function figure1(name: string): Node[] {
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
  return [origin, ...orbit];
}

export function figure2(name: string): Node[] {
  const origin = figure1(`${name}-0`);
  const orbit = range(6).map((i) => {
    return figure1(`${name}-${i + 1}`).map((n) => ({
      ...n,
      coords: sumCoords([
        n.coords,
        polar(1, degrees(i * 60)),
        polar(1, degrees((i + 1) * 60)),
      ]),
    }));
  });
  return [...origin, ...orbit.flat()];
}

export function _figure4(name: string): Node[] {
  const a = figure2(`${name}-0`);
  const b0 = figure2(`${name}-1`);
  const b = b0.map((n) => ({
    ...n,
    coords: rotate(n.coords, radians(-2 * Math.asin(1 / 4))),
  }));
  return [...a, ...b];
}
export function figure4(name: string): Node[] {
  const fig0 = _figure4(name);
  // manually inspected the graph to find the desired node ids
  const idA = `${name}-0-3-5`;
  const idB = `${name}-0-1-6`;
  const a = fig0.find((n) => n.id === idA);
  const b = fig0.find((n) => n.id === idB);
  if (!a) throw new Error("figure 4: couldn't find node A");
  if (!b) throw new Error("figure 4: couldn't find node B");
  a.label = "A";
  a.color = "red";
  b.label = "B";
  b.color = "blue";
  return fig0;
}

export function figure5(name: string): Node[] {
  const fig0 = figure4(`${name}-0`);
  const a = fig0.find((n) => n.label === "A");
  const b = fig0.find((n) => n.label === "B");
  if (!a) throw new Error("figure 5: couldn't find node A");
  if (!b) throw new Error("figure 5: couldn't find node B");
  const fig1 = fig0.map((n) => ({
    ...n,
    id: n.id.replace(new RegExp(`^${name}-0-`), `${name}-1-`),
    ...(n.label === "B" ? { label: "B'" } : {}),
    coords: rotateAbout(n.coords, radians(-2 * Math.asin(1 / 8)), a.coords),
  }));
  return [...fig0, ...fig1].map((n) => ({
    ...n,
    // inspecting manually, this gets us close to y-axis symmetry
    coords: rotate(n.coords, degrees(97)),
  }));
}

/**
 * Equilateral triangle; 60 degree angles
 */
export function triangle60(name: string): Node[] {
  const o = {
    id: `${name}-0`,
    label: "O",
    coords: xy(0, 0),
  };
  const a = {
    id: `${name}-1`,
    coords: polar(1, degrees(0)),
  };
  const b = {
    id: `${name}-2`,
    coords: polar(1, degrees(60)),
  };
  return [o, a, b];
}
export function rhombus60(name: string): Node[] {
  const [o, a, b] = triangle60(name);
  const c = {
    id: `${name}-3`,
    label: "C",
    coords: translate(a.coords, b.coords),
  };
  return [o, a, b, c];
}

function moserSpindleAngle(): Angle {
  // In a Moser spindle, the distance between r1c and r2c must be 1.
  // What angle `a` do we rotate r2 to construct that? High school geometry will tell.
  //
  // given: r1c = (0, 0); r2c = (1, 0); r1o === r2o; o.x = 0.5
  // find angle a
  const hyp = distance(toXY(rhombus60Hyp()));
  return radians(Math.asin(0.5 / hyp));
}
function rhombus60Hyp(): Coords {
  const r0 = rhombus60("");
  return r0[3].coords;
}
/**
 * Moser spindle
 */
export function figure7a(name: string): Node[] {
  const hyp = rhombus60Hyp();
  const a = moserSpindleAngle();
  const r1 = mapCoords(
    rhombus60(`${name}-0`),
    flow(
      (c) => recenter(c, hyp),
      (c) => rotate(c, degrees(180)),
      (c) => rotate(c, degrees(60)),
      (c) => rotate(c, negateAngle(a))
    )
  );
  const r2 = mapCoords(
    rhombus60(`${name}-1`),
    flow(
      (c) => recenter(c, hyp),
      (c) => rotate(c, degrees(180)),
      (c) => rotate(c, degrees(60)),
      (c) => rotate(c, a),
      (c) => translate(c, xy(1, 0))
    )
  );
  const ret = [...r1, ...r2];
  // to support other transforms, set point o back to the origin.
  // also rotate it so it looks like figure 7a
  return mapCoords(
    ret,
    flow(
      (c) => recenter(c, r1[0].coords),
      (c) => rotate(c, degrees(180))
    )
  );
}
export function figure7b(name: string): Node[] {
  const g1 = figure7a(`${name}-0`);
  const a = moserSpindleAngle();
  const g2 = mapCoords(
    figure7a(`${name}-1`),
    flow((c) => rotate(c, negateAngle(a)))
  );
  const g3 = mapCoords(
    figure7a(`${name}-2`),
    flow((c) => rotate(c, a))
  );
  return [...g1, ...g2, ...g3];
}

export function figure7c(name: string): Node[] {
  // "The angles of the edges relative to the vector (1,0) are i arcsin(√3/2) + j arcsin(1/√12), i ∈ 0 ... 5, j ∈ −2 ... 2}."
  const ai = Math.asin(Math.sqrt(3) / 2);
  const aj = Math.asin(1 / Math.sqrt(12));
  const angles: Angle[] = range(0, 5 + 1)
    .map((i) => range(-2, 2 + 1).map((j) => radians(i * ai + j * aj)))
    .flat();
  return angles.flatMap((a, i) =>
    mapCoords(triangle60(`${name}-${i}`), (c) => rotate(c, a))
  );
}

export function figureW(name: string): Node[] {
  // "Let W be the 301-vertex graph consisting of all points at distance ≤√3 from the origin that are the sum of two edges of V (interpreted as vectors)"
  const graphV = figure7c("");
  const byId = keyBy(graphV, (n) => n.id);
  const collide = C.collide(graphV);
  const threshold = Math.sqrt(3);
  const nodes = collide.uniqueEdges
    .map((a, i) => {
      const an0 = byId[a[0].id];
      const an1 = byId[a[1].id];
      const av = recenter(an1.coords, an0.coords);
      return collide.uniqueEdges.slice(i + 1).map((b) => {
        const bn0 = byId[b[0].id];
        const bn1 = byId[b[1].id];
        const bv = recenter(bn1.coords, bn0.coords);
        return translate(av, bv);
      });
    })
    .flat()
    .filter((coords) => distance(toXY(coords)) <= threshold)
    .map((coords, i) => {
      return { id: `${name}-${i}`, coords };
    });
  return nodes;
}

export function figure8(name: string): Node[] {
  // "The 1345-vertex graph shown in Figure 8 is the union of W with six translates of it in which the origin is mapped to a vertex of H"
  const w0 = figureW(`${name}-$$I$$`);
  // Our dead-simple collision detection takes O(number-of-nodes^2) time, so
  // multiple collision-detection/duplicate-filtering passes during node gen
  // is dramatically faster.
  // Before adding this one: "node generation in 47ms, collision detection (edges/duplicates) in 11295ms"
  // After adding this one: "node generation in 340ms, collision detection (edges/duplicates) in 2383ms"
  // TODO: this won't be enough for the 20k-node final result, I think. Probably going to need bucketing.
  // And even then, rendering will be slow!
  const wCollide = C.collide(w0);
  return figure1("")
    .map((o, i) => {
      return mapCoords(wCollide.fig.nodes, (c) => translate(c, o.coords)).map(
        (n) => ({ ...n, id: n.id.replace("$$I$$", `${i}`) })
      );
    })
    .flat();
}
