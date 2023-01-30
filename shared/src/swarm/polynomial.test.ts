import * as P from "./polynomial.js";

type Case = { p: P.Polynomial; t: number; o: number };
const cases: Case[] = [
  { p: [], t: 0, o: 0 },
  { p: [0], t: 0, o: 0 },
  { p: [2], t: 0, o: 2 },
  { p: [2], t: 1, o: 2 },
  { p: [2], t: 2, o: 2 },
  { p: [2, 3], t: 0, o: 2 },
  { p: [2, 3], t: 1, o: 5 },
  { p: [2, 3], t: 2, o: 8 },
  { p: [2, 3], t: 3, o: 11 },
  { p: [2, 3, 1], t: 0, o: 2 },
  { p: [2, 3, 1], t: 1, o: 6 },
  { p: [2, 3, 1], t: 2, o: 12 },
  { p: [2, 3, 1], t: 3, o: 20 },
];
test.each(cases)("simple polys: calc($p, $t) === $o", ({ p, t, o }) => {
  expect(P.calc(p, t)).toEqual(o);
});

// const ArbPolynomial = F.array(F.integer({ min: -1e10, max: 1e10 }));
// test("poly properties: constant", () => {
// F.assert(
// F.property(ArbPolynomial, (p) => {
// return P.calc(p, 0) === (p[0] ?? 0);
// }),
// { verbose: true }
// );
// });
//
// const ArbPositivePolynomial = F.array(F.integer({ min: 0, max: 1e10 }));
// test("poly properties: increasing if positive", () => {
// F.assert(
// F.property(ArbPositivePolynomial, (p) => {
// return P.calc(p, 1) >= (p[0] ?? 0);
// }),
// { verbose: true }
// );
// });
// test("poly properties: positive", () => {
// F.assert(
// F.property(ArbPositivePolynomial, (p) => {
// return P.calc(p, 1) >= (p[0] ?? 0);
// }),
// { verbose: true }
// );
// });
//
// function ArbSwarmPolynomialOfDegree(n: number) {
// return F.array(F.integer({ min: -1e10, max: 1e10 }), {
// minLength: n,
// maxLength: n,
// }).filter((poly) => {
// the constant value is <0 and all other values are >0.
// This format represents swarmsim unit purchases, calculating when you'll be able to afford something.
// It should always have positive roots - that is, we'll always be able to afford something *eventually* if we're actually generating money for it.
// switch (poly.length) {
// case 2: {
// const [b, a] = poly;
// return b <= 0 && a > 0;
// }
// case 3: {
// const [c, b, a] = poly;
// return c <= 0 && b >= 0 && a > 0;
// }
// case 4: {
// const [d, c, b, a] = poly;
// return d <= 0 && c >= 0 && b >= 0 && a > 0;
// }
// default:
// return false;
// }
// });
// }
// TODO: what's wrong here?
// can't make sense of the cubic failures, but I don't understand that formula to begin with
// the quadratic failures are just decimal precision
// test.each([2, 3, 4])(
// "poly properties: swarm polynomial has roots: degree $0",
// (n) => {
// F.assert(
// F.property(ArbSwarmPolynomialOfDegree(n), (p) => {
// const roots = P.findRoots(p);
// const nnegRoots = roots.filter((r) => r >= 0);
// if (nnegRoots.length === 0) {
// console.log("fail", { p, roots, nnegRoots });
// }
// return nnegRoots.length > 0;
// }),
// { verbose: true }
// );
// F.assert(
// F.property(ArbSwarmPolynomialOfDegree(n), (p) => {
// const roots = P.findRoots(p);
// const nnegRoots = roots.filter((r) => r >= 0);
// return all(nnegRoots, (t) => P.isRoot(p, t));
// }),
// { verbose: true }
// );
// }
// );
// function all<A>(list: A[], pred: (a: A) => boolean): boolean {
// return list.reduce((accum, val) => accum && pred(val), true);
// }
