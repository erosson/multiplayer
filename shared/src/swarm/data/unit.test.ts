import * as U from "./unit";

test("all unit ids are defined", () => {
  expect(new Set(U.list.map((u) => u.id))).toEqual(new Set(U.ids));
  expect(new Set(Object.keys(U.byId))).toEqual(new Set(U.ids));
  expect(new Set(Object.keys(U.ID))).toEqual(new Set(U.ids));
  expect(U.ID.drone).toBeTruthy();
  expect(U.byId.drone).toBeTruthy();
  // type error for bogus unit ids
  // @ts-expect-error
  expect(U.ID.notAUnit).toBeFalsy();
  // @ts-expect-error
  expect(U.byId.notAUnit).toBeFalsy();
});
