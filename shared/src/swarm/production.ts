import * as P from "./polynomial";
import { range, product, fact } from "./util";

export interface ProductionUnit {
  count: number;
  production: number;
}
export type Production = ProductionUnit[];

export function toPolynomial(c: number, p: Production): P.Polynomial {
  const r = [...p].reverse();
  return [c].concat(
    r
      .map(
        (u, i) =>
          (u.count * product(p.slice(i).map((cu) => cu.production))) / fact(i)
      )
      .reverse()
  );
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
