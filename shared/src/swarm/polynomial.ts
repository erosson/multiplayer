import { sum } from "./util/math";

/**
 * p[0] + (p[1] * t) + (p[2] * t^2) + (p[3] * t^3) + ...
 */
export type Polynomial = number[];

export function normalize(p: Polynomial): Polynomial {
  p = [...p];
  // remove leading zeros
  while (p[p.length - 1] === 0 && p.length > 1) {
    p.pop();
  }
  if (p.length <= 0) {
    p.push(0);
  }
  return p;
}
export function degree(p: Polynomial): number {
  return normalize(p).length - 1;
}
export function calc(p: Polynomial, t: number, degree: number = 0): number {
  if (degree > 0) {
    p = p.slice(degree);
  }
  return sum(p.map((c, i) => calc1(c, i, t)));
}
export function isRoot(
  poly: Polynomial,
  t: number,
  tolerance: number = 1e-2
): boolean {
  const calc_ = calc(poly, t);
  // const isRoot_ = calc_ === 0;
  const isRoot_ = tolerance === 0 ? calc_ === 0 : Math.abs(calc_) < tolerance;
  if (!isRoot_) console.log("isRoot", { poly, t, isRoot_, calc_ });
  return isRoot_;
}
export function findRoots(poly: Polynomial): number[] {
  const rawRoots = _findRoots(poly);
  // remove dupes and NaNs
  const roots = Array.from(new Set(rawRoots.filter((r) => !isNaN(r))));
  // console.log("findRoots", { poly, rawRoots, roots });
  return roots;
}
export function _findRoots(poly: Polynomial): number[] {
  // degree = p.length - 1
  switch (poly.length) {
    case 0:
      return [];
    case 1:
      return [];
    case 2: {
      // linear: x = -b/a
      const [b, a] = poly;
      return [-b / a];
    }
    case 3: {
      // quadratic: x = [-b ± √(b2 – 4ac)]/2a
      const [c, b, a] = poly;
      const disc = b * b - 4 * a * c;
      const denom = 2 * a;
      const sqrtDisc = Math.sqrt(disc);
      return [(-b + sqrtDisc) / denom, (-b - sqrtDisc) / denom];
    }
    case 4:
      // cubic: https://math.vanderbilt.edu/schectex/courses/cubic/
      // x = {q + [q2 + (r-p2)3]1/2}1/3   +   {q - [q2 + (r-p2)3]1/2}1/3   +   p
      // where
      // p = -b/(3a),   q = p3 + (bc-3ad)/(6a2),   r = c/(3a)
      const [d, c, b, a] = poly;
      const p = -b / (3 * a);
      const q = Math.pow(p, 3) + (b * c - 3 * a * d) / (6 * Math.pow(a, 2));
      const r = c / (3 * a);
      const disc = Math.pow(q, 2) + Math.pow(r - Math.pow(p, 2), 3);
      const sqrtDisc = Math.sqrt(disc);
      return [p, Math.cbrt(q + sqrtDisc), Math.cbrt(q - sqrtDisc)];
    default:
      // TODO use newton's method for higher-degree polynomials
      throw new Error(
        `roots of polynomials of degree ${poly.length - 1} (length ${
          poly.length
        }) not yet implemented`
      );
  }
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
