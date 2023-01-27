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
} from "./node";
import { range, sum } from "shared/src/swarm/util/math";

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
