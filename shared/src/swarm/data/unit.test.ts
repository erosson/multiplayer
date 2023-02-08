import list from "./unit";
import { Unit } from "./id";

test("all unit ids are defined", () => {
  expect(new Set(list.map((u) => u.id))).toEqual(new Set(Object.values(Unit)));
  expect(Unit.drone).toBeTruthy();

  //// @ts-expect-error type error for bogus unit ids
  //Unit.notAUnit;
});
