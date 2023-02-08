import { UnitID } from "../schema";
import * as G from "./graph";
import { Unit } from "./id";
import * as D from "./index";

test("prod graph", () => {
  const d = D.create();
  const g = G.producer(d.unit.list);
  expect(g).toBeTruthy();
  function childPaths(id: UnitID): G.ProducerPath[] {
    return g.childPaths.get(id) ?? [];
  }
  // are paths built? are they going the right direction?
  expect(Math.max(...childPaths(Unit.larva).map((p) => p.path.length))).toBe(1);
  expect(childPaths(Unit.larva)).toHaveLength(2);
  expect(childPaths(Unit.hatchery).map((p) => p.path.length)).toEqual([0]);
  expect(
    Math.max(...childPaths(Unit.mineral).map((p) => p.path.length))
  ).toBeGreaterThanOrEqual(1);
});
