import { Unit } from "./id";
import list from "./unit";

test("all unit ids are defined", () => {
  expect(new Set(list.map((u) => u.id))).toEqual(new Set(Object.values(Unit)));
  expect(Unit.drone).toBeTruthy();

  //// @ts-expect-error type error for bogus unit ids
  //Unit.notAUnit;
});
