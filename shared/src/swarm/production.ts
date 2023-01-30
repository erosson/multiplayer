import * as P from "./polynomial.js";
import { range, product, fact } from "./util/math.js";

export interface ProductionUnit {
  count: number;
  production: number;
}
export type Production = ProductionUnit[];

export function toPolynomial(
  c: number,
  p: Production,
  index: number = 0
): P.Polynomial {
  const r = [...p.slice(index)];
  return [index === 0 ? c : p[index - 1].count].concat(
    r.map(
      (u, i) =>
        (u.count * product(r.slice(0, i + 1).map((cu) => cu.production))) /
        fact(i + 1)
    )
  );
}
export function toPolynomials(c: number, p: Production): P.Polynomial[] {
  return range(p.length + 1).map((i) => toPolynomial(c, p, i));
}

export function calc(
  c: number,
  p: Production,
  t: number,
  index: number = 0
): number {
  const poly =
    index <= 0
      ? toPolynomial(c, p)
      : toPolynomial(p[index - 1].count, p.slice(index, p.length));
  return P.calc(poly, t);
}
export function calcs(c: number, p: Production, t: number): number[] {
  return range(p.length + 1).map((i) => calc(c, p, t, i));
}
