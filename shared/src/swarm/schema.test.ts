import * as S from "./schema";

test("ID types", () => {
  enum X {
    x = "X",
  }
  type IDX = S.ID<typeof X, typeof X, typeof X>;
  const idx: IDX = { Unit: X, Upgrade: X, Achievement: X };
  const idu: S.UnitID<IDX> = idx.Unit.x;
  // @ts-expect-error using the enum-less key doesn't work
  const idu2: S.UnitID<IDX> = "x";
  // @ts-expect-error nor the enum-less value
  const idu3: S.UnitID<IDX> = "X";
  // even though they are equal at runtime
  expect(idx.Unit.x).toBe(X.x);
  expect(idx.Unit.x).toBe("X");
});
