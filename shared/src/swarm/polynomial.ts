import { sum } from "./util";

/**
 * p[0] + (p[1] * t) + (p[2] * t^2) + (p[3] * t^3) + ...
 */
export type Polynomial = number[];

export function calc(p: Polynomial, t: number): number {
  return sum(p.map((c, i) => calc1(c, i, t)));
}

function calc1(c: number, index: number, t: number): number {
  return c * Math.pow(t, index);
}

function formatCoeff(c: number, i: number): string {
  if (c === 1 && i !== 0) return "";
  if (c < 0) return `${c}`;
  if (c < 100) {
    if (Number.isInteger(c)) return `${c}`;
    return c.toPrecision(3);
  }
  return `${c}`;
}
export function format(p: Polynomial): [string, number][] {
  return p.map((c, i) => [formatCoeff(c, i), i] as [string, number]).reverse();
}
export function formats(p: Polynomial): string[] {
  return format(p).map(([c, i]) => {
    switch (i) {
      case 0:
        return c;
      case 1:
        return `${c} t`;
      default:
        return `${c} t^${i}`;
    }
  });
}
export function toString(p: Polynomial): string {
  return formats(p).join(" + ");
}
