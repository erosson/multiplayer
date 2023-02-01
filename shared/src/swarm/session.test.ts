import * as S from "./session";
import * as Schema from "./schema";
import * as Data from "./data";

test("session basics: linear count", () => {
  const d = Data.create();
  const session = S.create(d);
  session.unit.hatchery.count = 10;
  session.unit.larva.count = 0;
  expect(S.unitPolynomial(session, d.id.Unit.larva)).toEqual([0, 10]);
  expect(S.unitCount(session, d.id.Unit.larva, S.elapsedMs(0))).toBe(0);
  expect(S.unitCount(session, d.id.Unit.larva, S.elapsedMs(1000))).toBe(10);
  expect(S.unitCount(session, d.id.Unit.larva, S.elapsedMs(2000))).toBe(20);
});

test("session basics: cubic count", () => {
  const d = Data.create();
  const session = S.create(d);
  session.unit.queen.count = 10;
  session.unit.mineral.count = 0;
  // expect(S.unitProduction(session, d.id.Unit.mineral)).toEqual([0, 0, 10, 0]);
  expect(S.unitPolynomial(session, d.id.Unit.mineral).slice(0, 4)).toEqual([
    0, 0, 10,
  ]);
  expect(S.unitCount(session, d.id.Unit.mineral, S.elapsedMs(0))).toBe(0);
  expect(S.unitCount(session, d.id.Unit.mineral, S.elapsedMs(1000))).toBe(10);
  expect(S.unitCount(session, d.id.Unit.mineral, S.elapsedMs(2000))).toBe(40);
});

test("session basics: 4 count", () => {
  const d = Data.create();
  const session = S.create(d);
  session.unit.nest.count = 10;
  session.unit.mineral.count = 0;
  expect(S.unitPolynomial(session, d.id.Unit.mineral).slice(0, 4)).toEqual([
    0, 0, 0, 20,
  ]);
  expect(S.unitCount(session, d.id.Unit.mineral, S.elapsedMs(0))).toBe(0);
  expect(S.unitCount(session, d.id.Unit.mineral, S.elapsedMs(1000))).toBe(20);
  expect(S.unitCount(session, d.id.Unit.mineral, S.elapsedMs(2000))).toBe(160);
});

test("session id types", () => {
  const d = Data.create();
  type ID = (typeof d)["id"];
  const u: S.Unit<ID> = { id: d.id.Unit.drone, count: 3 };
  const u2: S.Unit<ID> = { id: d.id.Unit.drone, count: 3 };
  // @ts-expect-error
  const u3: S.Unit<ID> = { id: "drone", count: 3 };
  // @ts-expect-error
  const u4: S.Unit<ID> = { id: "bogus", count: 3 };

  // non-enum ids, and ids where key !== value, work just like enums.
  // Supporting this is theoretically important - we could load ids from an
  // external file. (No practial value though.)
  const X = { x: "X" } as const;
  const Y = { y: "Y" } as const;
  enum Z {
    z = "Z",
  }
  type IDX = Schema.ID<typeof X, typeof Y, typeof Z>;
  const IDX: IDX = {
    Unit: X,
    Upgrade: Y,
    Achievement: Z,
  };
  const ux: S.Unit<IDX> = { id: X.x, count: 3 };
  // except that with non-enums, of course assigning the string value directly works
  const ux2: S.Unit<IDX> = { id: "X", count: 3 };
  // @ts-expect-error but not the string key
  const ux3: S.Unit<IDX> = { id: "x", count: 3 };
  // @ts-expect-error
  const ux4: S.Unit<IDX> = { id: "bogus", count: 3 };
});
