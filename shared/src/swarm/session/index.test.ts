import * as S from ".";
import * as Duration from "../duration";
import * as Schema from "../schema";
import * as Data from "../data";
import * as ID from "../data/id";
import * as MapU from "../util/map";

function mutateCount(ctx: S.Ctx, unitId: Schema.UnitID, count: number) {
  MapU.update(ctx.session.unit, unitId, (u) => {
    u = u ?? S.Unit.empty(S.Unit.schema({ ...ctx, unitId }));
    return { ...u, count };
  });
}

test("session basics: linear count", () => {
  const data = Data.create();
  const ctx = { ...S.empty(data), unitId: ID.Unit.larva };
  function d(ms: number): Date {
    return Duration.dateAdd(ctx.session.reified, Duration.fromMillis(ms));
  }
  mutateCount(ctx, ID.Unit.hatchery, 10);
  mutateCount(ctx, ID.Unit.larva, 0);
  expect(S.Unit.polynomial(ctx)).toEqual([0, 10]);
  expect(S.Unit.count({ ...ctx, now: d(0) })).toBe(0);
  expect(S.Unit.count({ ...ctx, now: d(1000) })).toBe(10);
  expect(S.Unit.count({ ...ctx, now: d(2000) })).toBe(20);
});

test("session basics: cubic count", () => {
  const data = Data.create();
  const ctx = { ...S.empty(data), unitId: ID.Unit.mineral };
  function d(ms: number): Date {
    return Duration.dateAdd(ctx.session.reified, Duration.fromMillis(ms));
  }
  mutateCount(ctx, ID.Unit.queen, 10);
  mutateCount(ctx, ID.Unit.mineral, 0);
  expect(S.Unit.polynomial(ctx)).toEqual([0, 0, 10]);
  expect(S.Unit.count({ ...ctx, now: d(0) })).toBe(0);
  expect(S.Unit.count({ ...ctx, now: d(1000) })).toBe(10);
  expect(S.Unit.count({ ...ctx, now: d(2000) })).toBe(40);
});

test("session basics: 4 count", () => {
  const data = Data.create();
  const ctx = { ...S.empty(data), unitId: ID.Unit.mineral };
  function d(ms: number): Date {
    return Duration.dateAdd(ctx.session.reified, Duration.fromMillis(ms));
  }
  mutateCount(ctx, ID.Unit.nest, 10);
  mutateCount(ctx, ID.Unit.mineral, 0);
  expect(S.Unit.polynomial(ctx)).toEqual([0, 0, 0, 10]);
  expect(S.Unit.count({ ...ctx, now: d(0) })).toBe(0);
  expect(S.Unit.count({ ...ctx, now: d(1000) })).toBe(10);
  expect(S.Unit.count({ ...ctx, now: d(2000) })).toBe(80);
});

test("reify doesn't affect other context fields", () => {
  const data = Data.create();
  const now = new Date(123);
  let ctx = { ...S.empty(data, now), now };
  expect(S.reify(ctx)).toEqual(ctx);
  expect(S.reify({ ...ctx, abc: 123 })).toEqual({ ...ctx, abc: 123 });
  expect(S.reify({ ...ctx, unitId: ID.Unit.larva })).toEqual({
    ...ctx,
    unitId: ID.Unit.larva,
  });
});
test("simple buy", () => {
  const data = Data.create();
  const now = new Date(123);
  let ctx = { ...S.empty(data, now), unitId: ID.Unit.drone, now };
  mutateCount(ctx, ID.Unit.larva, 10);
  mutateCount(ctx, ID.Unit.mineral, 35);
  expect(S.Unit.count(ctx)).toBe(0);
  expect(S.Unit.count({ ...ctx, unitId: ID.Unit.larva })).toBe(10);
  expect(S.Unit.count({ ...ctx, unitId: ID.Unit.mineral })).toBe(35);

  ctx = S.Unit.buy(ctx, 1);
  expect(S.Unit.count(ctx)).toBe(1);
  expect(S.Unit.count({ ...ctx, unitId: ID.Unit.larva })).toBe(9);
  expect(S.Unit.count({ ...ctx, unitId: ID.Unit.mineral })).toBe(25);

  ctx = S.Unit.buy(ctx, 2);
  expect(S.Unit.count(ctx)).toBe(3);
  expect(S.Unit.count({ ...ctx, unitId: ID.Unit.larva })).toBe(7);
  expect(S.Unit.count({ ...ctx, unitId: ID.Unit.mineral })).toBe(5);

  expect(() => S.Unit.buy(ctx, 1)).toThrow();
});

test("simple autobuy", () => {
  const data = Data.create();
  const now = new Date(123);
  function d(ms: number): Date {
    return Duration.dateAdd(ctx.session.reified, Duration.fromMillis(ms));
  }
  let ctx = { ...S.empty(data, now), unitId: ID.Unit.drone, now };
  expect(S.autobuyVelocities(ctx)).toMatchObject({});
  // neither valid nor autobuyable for non-buyable units
  expect(S.Unit.autobuyable({ ...ctx, unitId: ID.Unit.larva })).toMatchObject({
    isValid: false,
    isAutobuyable: false,
  });
  // neither valid nor autobuyable for units with nonlinear cost
  expect(
    S.Unit.autobuyable({ ...ctx, unitId: ID.Unit.hatchery })
  ).toMatchObject({
    isValid: false,
    isAutobuyable: false,
  });
  // valid but not autobuyable when we can't afford to autobuy anything
  mutateCount(ctx, ID.Unit.hatchery, 1);
  mutateCount(ctx, ID.Unit.larva, 0);
  mutateCount(ctx, ID.Unit.drone, 0);
  mutateCount(ctx, ID.Unit.mineral, 0);
  expect(S.Unit.autobuyable(ctx)).toMatchObject({
    isValid: true,
    isAutobuyable: false,
  });

  // valid and autobuyable
  mutateCount(ctx, ID.Unit.drone, 3);
  expect(S.autobuyVelocities(ctx)).toMatchObject({});
  expect(S.Unit.velocity(ctx)).toBe(0);
  expect(S.Unit.velocity({ ...ctx, unitId: ID.Unit.larva })).toBe(1);
  expect(S.Unit.velocity({ ...ctx, unitId: ID.Unit.mineral })).toBe(3);
  expect(S.Unit.count(ctx)).toBe(3);
  expect(S.Unit.autobuyable(ctx)).toMatchObject({
    isValid: true,
    isAutobuyable: true,
    velocity: 0.3,
  });

  // look at it go
  ctx = S.Unit.autobuy(ctx, 0.3);
  expect(S.Unit.polynomial(ctx)).toEqual([3, 0.3]);
  expect(S.autobuyVelocities(ctx)).toMatchObject(
    new Map([
      [ID.Unit.drone, 0.3],
      [ID.Unit.larva, -0.3],
      [ID.Unit.mineral, -3],
    ])
  );
  expect(S.Unit.velocity(ctx)).toBe(0.3);
  expect(S.Unit.count(ctx)).toBe(3);
  expect(S.Unit.velocity({ ...ctx, unitId: ID.Unit.larva })).toBe(0.7);
  expect(S.Unit.count({ ...ctx, unitId: ID.Unit.larva })).toBe(0);
  expect(S.Unit.velocity({ ...ctx, unitId: ID.Unit.mineral })).toBe(0);
  expect(S.Unit.count({ ...ctx, unitId: ID.Unit.mineral })).toBe(0);
  ctx = S.tick(ctx, d(5000));
  expect(S.Unit.velocity(ctx)).toBe(0.3);
  expect(S.Unit.count(ctx)).toBe(4.5);
  expect(S.Unit.velocity({ ...ctx, unitId: ID.Unit.larva })).toBe(0.7);
  expect(S.Unit.count({ ...ctx, unitId: ID.Unit.larva })).toBe(3.5);
  expect(S.Unit.velocity({ ...ctx, unitId: ID.Unit.mineral })).toBe(1.5);
  // we can autobuy more now. autybuy preview disregards existing autobuys
  expect(S.Unit.autobuyable(ctx)).toMatchObject({
    isValid: true,
    isAutobuyable: true,
    velocity: expect.closeTo(0.45),
  });
  expect(S.autobuyVelocities(ctx)).toMatchObject(
    new Map([
      [ID.Unit.drone, 0.3],
      [ID.Unit.larva, -0.3],
      [ID.Unit.mineral, -3],
    ])
  );

  ctx = S.tick(ctx, d(10000));
  expect(S.Unit.velocity(ctx)).toBe(0.3);
  expect(S.Unit.count(ctx)).toBe(6);
  expect(S.Unit.velocity({ ...ctx, unitId: ID.Unit.larva })).toBe(0.7);
  expect(S.Unit.count({ ...ctx, unitId: ID.Unit.larva })).toBe(7);
  expect(S.Unit.velocity({ ...ctx, unitId: ID.Unit.mineral })).toBe(3);
  expect(S.Unit.autobuyable(ctx)).toMatchObject({
    isValid: true,
    isAutobuyable: true,
    velocity: expect.closeTo(0.6),
  });
  expect(S.autobuyVelocities(ctx)).toMatchObject(
    new Map([
      [ID.Unit.drone, 0.3],
      [ID.Unit.larva, -0.3],
      [ID.Unit.mineral, -3],
    ])
  );

  ctx = S.tick(ctx, d(15000));
  expect(S.Unit.velocity(ctx)).toBe(0.3);
  expect(S.Unit.count(ctx)).toBe(7.5);
  expect(S.Unit.velocity({ ...ctx, unitId: ID.Unit.larva })).toBe(0.7);
  expect(S.Unit.count({ ...ctx, unitId: ID.Unit.larva })).toBe(10.5);
  expect(S.Unit.velocity({ ...ctx, unitId: ID.Unit.mineral })).toBe(4.5);
  expect(S.Unit.autobuyable(ctx)).toMatchObject({
    isValid: true,
    isAutobuyable: true,
    velocity: expect.closeTo(0.75),
  });
  expect(S.autobuyVelocities(ctx)).toMatchObject(
    new Map([
      [ID.Unit.drone, 0.3],
      [ID.Unit.larva, -0.3],
      [ID.Unit.mineral, -3],
    ])
  );

  // multiple autobuys overwrite earlier autobuys
  ctx = S.Unit.autobuy(ctx, 0.75);
  expect(S.autobuyVelocities(ctx)).toMatchObject(
    new Map([
      [ID.Unit.drone, 0.75],
      [ID.Unit.larva, -0.75],
      [ID.Unit.mineral, -7.5],
    ])
  );

  // too much gets capped
  // expect(() => S.Unit.autobuy(ctx, 9999)).toThrow();
});
