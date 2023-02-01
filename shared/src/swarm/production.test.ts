import * as P from "./production";
import { Polynomial } from "./polynomial";

type Case = {
  c: number;
  u: P.Production;
  t: number;
  p: Polynomial;
  o: number[];
};
function u(count: number, production: number): P.ProductionUnit {
  return { count, production };
}
function fs(
  cp: { c: number; u: P.Production; p: Polynomial },
  tos: { t: number; o: number[] }[]
): Case[] {
  return tos.map((to) => ({ ...to, ...cp }));
}
const cases: Case[] = [
  fs({ c: 0, u: [], p: [0] }, [
    { t: 0, o: [0] },
    { t: 1, o: [0] },
    { t: 2, o: [0] },
  ]),
  fs({ c: 1, u: [], p: [1] }, [
    { t: 0, o: [1] },
    { t: 1, o: [1] },
    { t: 2, o: [1] },
  ]),
  fs({ c: 0, u: [u(0, 1)], p: [0] }, [
    { t: 0, o: [0, 0] },
    { t: 1, o: [0, 0] },
    { t: 2, o: [0, 0] },
  ]),
  fs({ c: 0, u: [u(1, 0)], p: [0] }, [
    { t: 0, o: [0, 1] },
    { t: 1, o: [0, 1] },
    { t: 2, o: [0, 1] },
  ]),
  fs({ c: 2, u: [u(1, 0)], p: [2] }, [
    { t: 0, o: [2, 1] },
    { t: 1, o: [2, 1] },
    { t: 2, o: [2, 1] },
  ]),
  fs({ c: 0, u: [u(1, 1)], p: [0, 1] }, [
    { t: 0, o: [0, 1] },
    { t: 1, o: [1, 1] },
    { t: 2, o: [2, 1] },
  ]),
  fs({ c: 0, u: [u(2, 2)], p: [0, 4] }, [
    { t: 0, o: [0, 2] },
    { t: 1, o: [4, 2] },
    { t: 2, o: [8, 2] },
  ]),
].flat();
test.each(cases)("Production.toPolynomial($c, $u) === $p", ({ c, u, p }) => {
  expect(P.toPolynomial(c, u)).toEqual(p);
});
test.each(cases)("Production.calc($c, $u, $t) === $o", ({ c, u, t, o }) => {
  expect(P.calcs(c, u, t)).toEqual(o);

  expect([0, P.calc(c, u, t, 0)]).toEqual([0, o[0]]);
  for (let i = 0; i < u.length; i++) {
    expect([i + 1, P.calc(c, u, t, i + 1)]).toEqual([i + 1, o[i + 1]]);
  }
});
