import list from "./unit.js";
import { Unit } from "./id.js";

test("all unit ids are defined", () => {
  expect(new Set(list.map((u) => u.id))).toEqual(new Set(Object.values(Unit)));
  expect(Unit.drone).toBeTruthy();

  // @ts-expect-error type error for bogus unit ids
  expect(Unit.notAUnit).toBeFalsy();
});
