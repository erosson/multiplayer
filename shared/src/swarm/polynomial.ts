import { sum } from "./util";

/**
 * p[0] + (p[1] * t) + (p[2] * t^2) + (p[3] * t^3)
 */
export type Polynomial = number[];

export function calc(p: Polynomial, t: number): number {
  return sum(p.map((c, i) => calc1(c, i, t)));
}

function calc1(c: number, index: number, t: number): number {
  return c * Math.pow(t, index);
}
