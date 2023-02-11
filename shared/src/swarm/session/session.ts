import * as I from "immer";
import { omit } from "lodash";
import * as Data from "../data";
import * as Duration from "../duration";
import * as S from "../schema";
import * as MapU from "../util/map";
import * as Progress from "./progress";
import * as T from "./type";
import * as Unit from "./unit";
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
    progress: [
      { id: "a", stateId: Progress.StateID.test, value: 0 },
      { id: "b", stateId: Progress.StateID.test2, value: 0 },
    ],
    complete: new Map(),
  };
  return { session, undo: session, data, now };
}

export function context(data: Data.Data, session: Value, now: Date): Ctx {
  return {
    data,
    session,
    undo: session,
    now,
  };
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
    const r = progress(ctx);
    ctx.session.progress = r.values;
    // ctx.session.complete = r.complete;
    ctx.session.complete = new Map();
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

export function progress(ctx: Ctx): Progress.Results {
  const t = Duration.toSeconds(sinceReified(ctx));
  const { progress, complete } = ctx.session;
  return Progress.tickResults({ values: progress, complete }, t);
}

export function reducer(ctx: Ctx, action: T.Action): Ctx {
  if (action.type !== "tick") {
    console.log("reducer", { ctx, action });
  }
  switch (action.type) {
    case "tick": {
      const now = new Date();
      return { ...ctx, now };
    }
    case "debug-set-session": {
      ctx = { ...ctx, undo: ctx.session };
      return {
        ...ctx,
        session: action.session,
        now: action.now ?? ctx.now,
      };
    }
    case "buy": {
      ctx = { ...ctx, undo: ctx.session };
      const { unitId, count } = action;
      const uctx: Unit.Ctx = { ...ctx, unitId };
      return omit(Unit.buy(uctx, count), "unitId");
    }
    case "autobuy": {
      ctx = { ...ctx, undo: ctx.session };
      const { unitId, count } = action;
      const uctx: Unit.Ctx = { ...ctx, unitId };
      return omit(Unit.autobuy(uctx, count), "unitId");
    }
    case "undo": {
      return { ...ctx, session: ctx.undo, undo: ctx.session };
    }
    default: {
      return ctx;
    }
  }
}
