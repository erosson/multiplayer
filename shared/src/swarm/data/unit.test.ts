import list from "./unit";
import { units as ids, Unit as ID } from "./id";

test("all unit ids are defined", () => {
  expect(new Set(list.map((u) => u.id))).toEqual(new Set(ids));
  // expect(new Set(Object.keys(U.byId))).toEqual(new Set(ids));
  expect(new Set(Object.keys(ID))).toEqual(new Set(ids));
  expect(ID.drone).toBeTruthy();
  // expect(byId.drone).toBeTruthy();

  // type error for bogus unit ids
  // @ts-expect-error
  expect(ID.notAUnit).toBeFalsy();
  // // @ts-expect-error
  // expect(U.byId.notAUnit).toBeFalsy();
});
