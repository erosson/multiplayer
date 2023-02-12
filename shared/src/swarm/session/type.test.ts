import * as S from ".";
import * as Proto from "../../../dist/swarm/session/session";
import * as Data from "../data";
import * as Schema from "../schema";
import * as T from "./type";

test("encode/decode runtime", () => {
  const data = Data.create();
  const { session } = S.empty(data);
  const enc = T.Session.codec.encode(session);
  const decR = T.Session.codec.decode(enc);
  const dec: T.Session = decR._tag === "Right" ? decR.right : (null as any);
  expect(dec).not.toBeNull();
  expect(Proto.Session.is(enc)).toBe(true);
  expect(T.Session.codec.is(dec)).toBe(true);
  expect(T.Session.codec.is({ ...dec, started: null })).toBe(false);
  expect(dec).toEqual(session);
});

test("encode/decode valid proto", () => {
  const now = new Date().toISOString();
  const proto = Proto.Session.create({
    started: now,
    reified: now,
    updated: now,
    unit: [],
    autobuy: [],
  });
  const decR = T.Session.codec.decode(proto);
  const dec: T.Session = decR._tag === "Right" ? decR.right : (null as any);
  expect(dec).not.toBeNull();
  const enc = T.Session.codec.encode(dec);
  expect(Proto.Session.is(proto)).toBe(true);
  expect(Proto.Session.is(enc)).toBe(true);
  expect(proto).toEqual(enc);
  expect(T.Session.codec.is(dec)).toBe(true);
});

test("encode/decode invalid proto", () => {
  const now = new Date().toISOString();
  const proto = Proto.Session.create({
    // started: now,
    reified: now,
    updated: now,
    unit: [],
    autobuy: [],
  });
  const decR = T.Session.codec.decode(proto);
  expect(decR._tag).toBe("Left");
});

test("encode/decode tick action", () => {
  const proto = Proto.TickAction.create({});
  const decR = T.TickAction.codec.decode(proto);
  const dec: T.TickAction = decR._tag === "Right" ? decR.right : (null as any);
  expect(decR._tag).toBe("Right");
  expect(dec).not.toBeNull();
  const expected: T.TickAction = { type: "tick" };
  expect(dec).toEqual(expected);
  const enc = T.TickAction.codec.encode(dec);
  expect(Proto.TickAction.is(proto)).toBe(true);
  expect(Proto.TickAction.is(enc)).toBe(true);
  expect(proto).toEqual(enc);
  expect(T.TickAction.codec.is(dec)).toBe(true);
});

test("encode/decode buy action", () => {
  const proto = Proto.BuyAction.create({ unitId: "drone", count: 3 });
  const decR = T.BuyAction.codec.decode(proto);
  const dec: T.BuyAction = decR._tag === "Right" ? decR.right : (null as any);
  expect(decR._tag).toBe("Right");
  expect(dec).not.toBeNull();
  const expected: T.BuyAction = {
    type: "buy",
    unitId: Schema.UnitID.wrap("drone"),
    count: 3,
  };
  expect(dec).toEqual(expected);
  const enc = T.BuyAction.codec.encode(dec);
  expect(Proto.BuyAction.is(proto)).toBe(true);
  expect(Proto.BuyAction.is(enc)).toBe(true);
  expect(proto).toEqual(enc);
  expect(T.BuyAction.codec.is(dec)).toBe(true);
});
