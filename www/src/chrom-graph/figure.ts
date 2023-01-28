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

export interface Figure {
  nodes: Node[];
  edges: Edge[];
}

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

export function rhombus60(name: string): Node[] {
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
