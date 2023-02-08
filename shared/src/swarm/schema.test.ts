import * as S from "./schema";

test("newtype ID types", () => {
  const x: S.UnitID = S.UnitID.wrap("x");
  const s: string = "x";
  // newtypes have runtime equality
  expect(x).toEqual("x");
  // newtypes *cannot* be downcast to their base type
  // @ts-expect-error
  const xs: string = x;
  // newtypes *cannot* be upcast from their base type, not without the ctor
  // @ts-expect-error
  const sx1: S.UnitID = s;
  // @ts-expect-error
  const sx2: S.UnitID = "x";
});

test("newtype ID type sets", () => {
  const x: S.UnitID = S.UnitID.wrap("x");
  const s: string = "x";
  // branded types work as set indexes! (newtypes can't do this!)
  const xset: Set<S.UnitID> = new Set();
  xset.add(x);
  expect(xset.has(x)).toBe(true);
  // the branded type applies as expected
  // @ts-expect-error
  xset.has(s);
  // @ts-expect-error
  xset.has("x");
});

test("newtype ID type objs", () => {
  const x: S.UnitID = S.UnitID.wrap("x");
  const s: string = "x";
  // newtypes don't work as dict indexes! use maps instead.
  // const xdict: Record<S.UnitID, number> = {};
  // @ts-expect-error
  const xdict: { [x: S.UnitID]: number } = {};
});

test("newtype ID type maps", () => {
  const x: S.UnitID = S.UnitID.wrap("x");
  const s: string = "x";
  const xmap: Map<S.UnitID, number> = new Map();
  xmap.set(x, 3);
  // @ts-expect-error
  xmap.set("x", 3);
  // @ts-expect-error
  xmap.set(s, 3);
  expect(xmap.get(x)).toBe(3);
  // @ts-expect-error
  expect(xmap.get("x")).toBe(3);
  // @ts-expect-error
  expect(xmap.get(s)).toBe(3);
});
