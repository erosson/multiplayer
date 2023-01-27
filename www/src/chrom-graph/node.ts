import { sum } from "shared/src/swarm/util/math";

export type ID = string;

export interface Node {
  id: ID;
  label?: string;
  coords: Coords;
  color?: string;
}
export type Edge = [ID, ID];

export type Coords = XY | Polar | Rotate | Scale | SumCoords;
export type XY = { coords: "xy"; x: number; y: number };
export type Polar = { coords: "polar"; r: number; a: Angle };
export type SumCoords = { coords: "sum"; cs: Coords[] };
export type Scale = { coords: "scale"; c: Coords; s: number };
export type Rotate = { coords: "rotate"; c: Coords; a: Angle };
export function xy(x: number, y: number): Coords {
  return { coords: "xy", x, y };
}
export function polar(r: number, a: Angle): Coords {
  return { coords: "polar", r, a };
}
export function sumCoords(cs: Coords[]): Coords {
  return { coords: "sum", cs };
}
export function rotate(c: Coords, a: Angle): Coords {
  return { coords: "rotate", c, a };
}
export function translate(a: Coords, b: Coords): Coords {
  return sumCoords([a, b]);
}
export function scale(c: Coords, s: number): Coords {
  return { coords: "scale", c, s };
}
export function rotateAbout(c: Coords, a: Angle, o: Coords): Coords {
  return translate(rotate(translate(c, negate(o)), a), o);
}
export function negate(c: Coords): Coords {
  return scale(c, -1);
}

export type Angle = Radians | PiRadians | Degrees;
/**
 * Radians times pi, so we can delay irrational number math
 */
export type PiRadians = { angle: "pi-radians"; value: number };
export type Radians = { angle: "radians"; value: number };
export type Degrees = { angle: "degrees"; value: number };
export function piRadians(value: number): PiRadians {
  return { angle: "pi-radians", value };
}
export function radians(value: number): Radians {
  return { angle: "radians", value };
}
export function degrees(value: number): Degrees {
  return { angle: "degrees", value };
}

export function toRadians(a: Angle): number {
  switch (a.angle) {
    case "radians":
      return a.value;
    case "pi-radians":
      return a.value * Math.PI;
    case "degrees":
      return (a.value / 360) * 2 * Math.PI;
  }
}
export function toXY(c: Coords): { x: number; y: number } {
  switch (c.coords) {
    case "xy": {
      return { x: c.x, y: c.y };
    }
    case "polar": {
      const rad = toRadians(c.a);
      return { x: c.r * Math.cos(rad), y: c.r * Math.sin(rad) };
    }
    case "rotate": {
      const xy = toXY(c.c);
      const r = Math.sqrt(xy.x * xy.x + xy.y * xy.y);
      const a = radians(Math.atan2(xy.y, xy.x) + toRadians(c.a));
      return toXY(polar(r, a));
    }
    case "scale": {
      const xy = toXY(c.c);
      return { x: xy.x * c.s, y: xy.y * c.s };
    }
    case "sum": {
      const xys = c.cs.map(toXY);
      return { x: sum(xys.map((pt) => pt.x)), y: sum(xys.map((pt) => pt.y)) };
    }
  }
}

// enum Color {
//   a = "yellow",
//   b = "red",
//   c = "blue",
//   d = "green",
//   e = "purple",
//   f = "orange",
//   g = "pink",
// }
