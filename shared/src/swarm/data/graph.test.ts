import * as G from "./graph";

test("prod graph", () => {
  const g = G.producer();
  expect(g).toBeTruthy();
  // are paths built? are they going the right direction?
  expect(Math.max(...g.childPaths.larva.map((p) => p.path.length))).toBe(1);
  expect(g.childPaths.hatchery.map((p) => p.path.length)).toEqual([]);
  expect(
    Math.max(...g.childPaths.mineral.map((p) => p.path.length))
  ).toBeGreaterThanOrEqual(1);
});
