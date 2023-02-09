import * as S from "../schema";
import * as Data from "../data";
import * as Duration from "../duration";
import * as T from "./type";
import * as Unit from "./unit";
import * as MapU from "../util/map";
import * as I from "immer";
I.enableAllPlugins();

export type Ctx = T.SessionCtx;
export type Value = T.Session;

export function empty(data: Data.Data, now?: Date): Ctx {
  now = now ?? new Date();
  const session: Value = {
    started: now,
    reified: now,
    updated: now,
    // TODO we should omit units that aren't yet in play, right?
    unit: new Map(data.unit.list.map((u) => [u.id, Unit.empty(u)])),
    autobuy: new Map(),
  };
  return { session, data, now };
}

export function context(data: Data.Data, session: Value, now: Date): Ctx {
  return { data, session, now };
}

export function since(ctx: Ctx, before: Date): Duration.T {
  return Duration.between({ before, after: ctx.now });
}
export function sinceStarted(ctx: Ctx): Duration.T {
  return since(ctx, ctx.session.started);
}
export function sinceUpdated(ctx: Ctx): Duration.T {
  return since(ctx, ctx.session.updated);
}
export function sinceReified(ctx: Ctx): Duration.T {
  return since(ctx, ctx.session.reified);
}

export function reify<X extends Ctx>(ctx0: X): X {
  return I.produce(ctx0, (ctx) => {
    for (let u of units(ctx)) {
      const uctx: Unit.Ctx = { ...ctx, unitId: u.id };
      u.count = Unit.count(uctx);
    }
    ctx.session.reified = Duration.dateAdd(
      ctx.session.reified,
      sinceReified(ctx)
    );
  });
}

export function tick<X extends Ctx>(ctx: X, now?: Date): X {
  now = now ?? new Date();
  return { ...ctx, now };
}

export function units(ctx: Ctx): T.Unit[] {
  return Array.from(ctx.session.unit.values());
}
export function unitIds(ctx: Ctx): S.UnitID[] {
  return units(ctx).map((u) => u.id);
}
export function unitCtxs<X extends Ctx>(ctx: X): (X & Unit.Ctx)[] {
  return unitIds(ctx).map((unitId) => ({ ...ctx, unitId }));
}

export function autobuyVelocities(ctx: Ctx): Map<S.UnitID, number> {
  return I.produce(new Map(), (accum) => {
    for (let order of ctx.session.autobuy.values()) {
      // subtract autobuy costs
      const unit = Unit.schema({ ...ctx, unitId: order.id });
      for (let cost of unit.cost ?? []) {
        const c = cost.value * order.count;
        MapU.update(accum, cost.unit, (v) => (v ?? 0) - c);
      }
      // add autobuy target
      MapU.update(accum, order.id, (v) => (v ?? 0) + order.count);
    }
  });
}
