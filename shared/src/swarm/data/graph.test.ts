import * as G from "./graph";
import * as D from "./index";

test("prod graph", () => {
  const d = D.create();
  const g = G.producer(d.unit.list);
  expect(g).toBeTruthy();
  // are paths built? are they going the right direction?
  expect(Math.max(...g.childPaths.larva.map((p) => p.path.length))).toBe(1);
  expect(g.childPaths.hatchery.map((p) => p.path.length)).toEqual([]);
  expect(
    Math.max(...g.childPaths.mineral.map((p) => p.path.length))
  ).toBeGreaterThanOrEqual(1);
});
