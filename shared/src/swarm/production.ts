import * as P from "./polynomial";
import { range, product, fact } from "./util/math";

export interface Production {
  units: ProductionUnit[];
  velocitys: ProductionVelocity[];
}

export interface ProductionVelocity {
  velocity: number;
  degree: number;
}
export interface ProductionUnit {
  count: number;
  production: number[];
}
export interface ConstantUnit {
  count: number;
  production: [];
}
export interface ConstantVelocity {
  count: number;
  degree: 0;
}

export function toPolynomial(
  prod: Production,
  index: number = 0
): P.Polynomial {
  const prod0 = prod;
  if (index > 0) {
    prod = {
      units: prod.units
        .filter((p) => p.production.length >= index)
        .map((p) => ({ ...p, production: p.production.slice(index) })),
      velocitys: prod.velocitys
        .filter((p) => p.degree >= index)
        .map((p) => ({ ...p, degree: p.degree - index })),
    };
  }
  const polyDegree = degree(prod);
  const ret = range(polyDegree + 1).map((_) => 0);
  for (let p of prod.units) {
    const degree = p.production.length;
    ret[degree] += (p.count * product(p.production)) / fact(degree);
  }
  for (let p of prod.velocitys) {
    ret[p.degree + 1] += p.velocity;
  }
  return P.normalize(ret);
}
export function degree(prod: Production): number {
  return Math.max(
    ...prod.units.map((p) => p.production.length),
    ...prod.velocitys.map((p) => p.degree)
  );
}
export function toPolynomials(p: Production): P.Polynomial[] {
  return range(degree(p) + 1).map((i) => toPolynomial(p, i));
}

export function calc(p: Production, t: number, index: number = 0): number {
  const poly = toPolynomial(p, index);
  return P.calc(poly, t);
}
export function calcs(p: Production, t: number): number[] {
  return range(degree(p) + 1).map((i) => calc(p, t, i));
}
