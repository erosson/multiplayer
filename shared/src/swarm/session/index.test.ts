import * as S from ".";
import * as Duration from "../duration";
import * as Schema from "../schema";
import * as Data from "../data";

test("session basics: linear count", () => {
  const data = Data.create();
  const ctx = { ...S.empty(data), unitId: data.id.Unit.larva };
  function d(ms: number): Date {
    return Duration.dateAdd(ctx.session.reified, Duration.fromMillis(ms));
  }
  ctx.session.unit.hatchery.count = 10;
  ctx.session.unit.larva.count = 0;
  expect(S.Unit.polynomial(ctx)).toEqual([0, 10]);
  expect(S.Unit.count({ ...ctx, now: d(0) })).toBe(0);
  expect(S.Unit.count({ ...ctx, now: d(1000) })).toBe(10);
  expect(S.Unit.count({ ...ctx, now: d(2000) })).toBe(20);
});

test("session basics: cubic count", () => {
  const data = Data.create();
  const ctx = { ...S.empty(data), unitId: data.id.Unit.mineral };
  function d(ms: number): Date {
    return Duration.dateAdd(ctx.session.reified, Duration.fromMillis(ms));
  }
  ctx.session.unit.queen.count = 10;
  ctx.session.unit.mineral.count = 0;
  expect(S.Unit.polynomial(ctx)).toEqual([0, 0, 10]);
  expect(S.Unit.count({ ...ctx, now: d(0) })).toBe(0);
  expect(S.Unit.count({ ...ctx, now: d(1000) })).toBe(10);
  expect(S.Unit.count({ ...ctx, now: d(2000) })).toBe(40);
});

test("session basics: 4 count", () => {
  const data = Data.create();
  const ctx = { ...S.empty(data), unitId: data.id.Unit.mineral };
  function d(ms: number): Date {
    return Duration.dateAdd(ctx.session.reified, Duration.fromMillis(ms));
  }
  ctx.session.unit.nest.count = 10;
  ctx.session.unit.mineral.count = 0;
  expect(S.Unit.polynomial(ctx)).toEqual([0, 0, 0, 10]);
  expect(S.Unit.count({ ...ctx, now: d(0) })).toBe(0);
  expect(S.Unit.count({ ...ctx, now: d(1000) })).toBe(10);
  expect(S.Unit.count({ ...ctx, now: d(2000) })).toBe(80);
});

test("session id types", () => {
  const d = Data.create();
  type ID = (typeof d)["id"];
  const u: S.T.Unit<ID> = { id: d.id.Unit.drone, count: 3 };
  const u2: S.T.Unit<ID> = { id: d.id.Unit.drone, count: 3 };
  // @ts-expect-error
  const u3: S.T.Unit<ID> = { id: "drone", count: 3 };
  // @ts-expect-error
  const u4: S.T.Unit<ID> = { id: "bogus", count: 3 };

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
  const ux: S.T.Unit<IDX> = { id: X.x, count: 3 };
  // except that with non-enums, of course assigning the string value directly works
  const ux2: S.T.Unit<IDX> = { id: "X", count: 3 };
  // @ts-expect-error but not the string key
  const ux3: S.Unit<IDX> = { id: "x", count: 3 };
  // @ts-expect-error
  const ux4: S.Unit<IDX> = { id: "bogus", count: 3 };
});
test("reify doesn't affect other context fields", () => {
  const data = Data.create();
  const now = new Date(123);
  let ctx = { ...S.empty(data, now), now };
  expect(S.reify(ctx)).toEqual(ctx);
  expect(S.reify({ ...ctx, abc: 123 })).toEqual({ ...ctx, abc: 123 });
  expect(S.reify({ ...ctx, unitId: data.id.Unit.larva })).toEqual({
    ...ctx,
    unitId: data.id.Unit.larva,
  });
});
test("simple buy", () => {
  const data = Data.create();
  const now = new Date(123);
  let ctx = { ...S.empty(data, now), unitId: data.id.Unit.drone, now };
  ctx.session.unit.larva.count = 10;
  ctx.session.unit.mineral.count = 35;
  expect(S.Unit.count(ctx)).toBe(0);
  expect(S.Unit.count({ ...ctx, unitId: data.id.Unit.larva })).toBe(10);
  expect(S.Unit.count({ ...ctx, unitId: data.id.Unit.mineral })).toBe(35);

  ctx = S.Unit.buy(ctx, 1);
  expect(S.Unit.count(ctx)).toBe(1);
  expect(S.Unit.count({ ...ctx, unitId: data.id.Unit.larva })).toBe(9);
  expect(S.Unit.count({ ...ctx, unitId: data.id.Unit.mineral })).toBe(25);

  ctx = S.Unit.buy(ctx, 2);
  expect(S.Unit.count(ctx)).toBe(3);
  expect(S.Unit.count({ ...ctx, unitId: data.id.Unit.larva })).toBe(7);
  expect(S.Unit.count({ ...ctx, unitId: data.id.Unit.mineral })).toBe(5);

  expect(() => S.Unit.buy(ctx, 1)).toThrow();
});

test("simple autobuy", () => {
  const data = Data.create();
  const u = data.id.Unit;
  const now = new Date(123);
  function d(ms: number): Date {
    return Duration.dateAdd(ctx.session.reified, Duration.fromMillis(ms));
  }
  let ctx = { ...S.empty(data, now), unitId: data.id.Unit.drone, now };
  expect(S.autobuyVelocities(ctx)).toMatchObject({});
  // neither valid nor autobuyable for non-buyable units
  expect(S.Unit.autobuyable({ ...ctx, unitId: u.larva })).toMatchObject({
    isValid: false,
    isAutobuyable: false,
  });
  // neither valid nor autobuyable for units with nonlinear cost
  expect(S.Unit.autobuyable({ ...ctx, unitId: u.hatchery })).toMatchObject({
    isValid: false,
    isAutobuyable: false,
  });
  // valid but not autobuyable when we can't afford to autobuy anything
  ctx.session.unit.hatchery.count = 1;
  ctx.session.unit.larva.count = 0;
  ctx.session.unit.drone.count = 0;
  ctx.session.unit.mineral.count = 0;
  expect(S.Unit.autobuyable(ctx)).toMatchObject({
    isValid: true,
    isAutobuyable: false,
  });

  // valid and autobuyable
  ctx.session.unit.drone.count = 3;
  expect(S.autobuyVelocities(ctx)).toMatchObject({});
  expect(S.Unit.velocity(ctx)).toBe(0);
  expect(S.Unit.velocity({ ...ctx, unitId: u.larva })).toBe(1);
  expect(S.Unit.velocity({ ...ctx, unitId: u.mineral })).toBe(3);
  expect(S.Unit.count(ctx)).toBe(3);
  expect(S.Unit.autobuyable(ctx)).toMatchObject({
    isValid: true,
    isAutobuyable: true,
    velocity: 0.3,
  });

  // look at it go
  ctx = S.Unit.autobuy(ctx, 0.3);
  expect(S.Unit.polynomial(ctx)).toEqual([3, 0.3]);
  expect(S.autobuyVelocities(ctx)).toMatchObject({
    drone: 0.3,
    larva: -0.3,
    mineral: -3,
  });
  expect(S.Unit.velocity(ctx)).toBe(0.3);
  expect(S.Unit.count(ctx)).toBe(3);
  expect(S.Unit.velocity({ ...ctx, unitId: u.larva })).toBe(0.7);
  expect(S.Unit.count({ ...ctx, unitId: u.larva })).toBe(0);
  expect(S.Unit.velocity({ ...ctx, unitId: u.mineral })).toBe(0);
  expect(S.Unit.count({ ...ctx, unitId: u.mineral })).toBe(0);
  ctx = S.tick(ctx, d(5000));
  expect(S.Unit.velocity(ctx)).toBe(0.3);
  expect(S.Unit.count(ctx)).toBe(4.5);
  expect(S.Unit.velocity({ ...ctx, unitId: u.larva })).toBe(0.7);
  expect(S.Unit.count({ ...ctx, unitId: u.larva })).toBe(3.5);
  expect(S.Unit.velocity({ ...ctx, unitId: u.mineral })).toBe(1.5);
  // we can autobuy more now. autybuy preview disregards existing autobuys
  // expect(S.Unit.autobuyable(ctx)).toMatchObject({
  // isValid: true,
  // isAutobuyable: true,
  // velocity: 0.45,
  // });
  expect(S.autobuyVelocities(ctx)).toMatchObject({
    drone: 0.3,
    larva: -0.3,
    mineral: -3,
  });

  ctx = S.tick(ctx, d(10000));
  expect(S.Unit.velocity(ctx)).toBe(0.3);
  expect(S.Unit.count(ctx)).toBe(6);
  expect(S.Unit.velocity({ ...ctx, unitId: u.larva })).toBe(0.7);
  expect(S.Unit.count({ ...ctx, unitId: u.larva })).toBe(7);
  expect(S.Unit.velocity({ ...ctx, unitId: u.mineral })).toBe(3);
  // expect(S.Unit.autobuyable(ctx)).toMatchObject({
  // isValid: true,
  // isAutobuyable: true,
  // velocity: 0.6,
  // });
  expect(S.autobuyVelocities(ctx)).toMatchObject({
    drone: 0.3,
    larva: -0.3,
    mineral: -3,
  });

  ctx = S.tick(ctx, d(15000));
  expect(S.Unit.velocity(ctx)).toBe(0.3);
  expect(S.Unit.count(ctx)).toBe(7.5);
  expect(S.Unit.velocity({ ...ctx, unitId: u.larva })).toBe(0.7);
  expect(S.Unit.count({ ...ctx, unitId: u.larva })).toBe(10.5);
  expect(S.Unit.velocity({ ...ctx, unitId: u.mineral })).toBe(4.5);
  expect(S.Unit.autobuyable(ctx)).toMatchObject({
    isValid: true,
    isAutobuyable: true,
    velocity: 0.75,
  });
  expect(S.autobuyVelocities(ctx)).toMatchObject({
    drone: 0.3,
    larva: -0.3,
    mineral: -3,
  });

  // multiple autobuys overwrite earlier autobuys
  ctx = S.Unit.autobuy(ctx, 0.75);
  expect(S.autobuyVelocities(ctx)).toMatchObject({
    drone: 0.75,
    larva: -0.75,
    mineral: -7.5,
  });

  // too much gets capped
  // expect(() => S.Unit.autobuy(ctx, 9999)).toThrow();
});
