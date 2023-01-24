import { expect, test } from "@jest/globals";
import * as P from "./polynomial";

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
