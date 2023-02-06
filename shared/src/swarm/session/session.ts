import * as S from "../schema";
import * as Data from "../data";
import * as Duration from "../duration";
import * as T from "./type";
import * as Unit from "./unit";

export type Ctx<I extends S.AnyID> = T.SessionCtx<I>;
export type CtxID<X extends Ctx<S.AnyID>> = X["data"]["id"];
type SnapshotCtx<I extends S.AnyID> = Ctx<I> & T.SnapshotCtx<I>;
export type Value<I extends S.AnyID> = T.Session<I>;

export function empty<I extends S.AnyID>(
  data: Data.Data<I>,
  now?: Date
): SnapshotCtx<I> {
  now = now ?? new Date();
  const session: T.Session<I> = {
    started: now,
    reified: now,
    updated: now,
    // TODO we should omit units that aren't yet in play, right?
    unit: Object.fromEntries(
      Object.values<S.UnitID<I>>(data.unit.list).map((u) => [
        u.id,
        Unit.empty(u),
      ])
    ),
  };
  return { session, data, now };
}

export function context<I extends S.AnyID>(
  data: Data.Data<I>,
  session: T.Session<I>
): Ctx<I> {
  return { data, session };
}

export function since(ctx: SnapshotCtx<any>, before: Date): Duration.T {
  return Duration.between({ before, after: ctx.now });
}
export function sinceStarted(ctx: SnapshotCtx<any>): Duration.T {
  return since(ctx, ctx.session.started);
}
export function sinceUpdated(ctx: SnapshotCtx<any>): Duration.T {
  return since(ctx, ctx.session.updated);
}
export function sinceReified(ctx: SnapshotCtx<any>): Duration.T {
  return since(ctx, ctx.session.reified);
}

export function reify<I extends S.AnyID, X extends SnapshotCtx<I>>(ctx0: X): X {
  const ctx1: X = ctx0.data.unit.list.reduce(
    (ctx, { id }) =>
      Unit.map<I, X & Unit.Ctx<I>>({ ...ctx, unitId: id }, (u, ctx) => ({
        ...u,
        count: Unit.count(ctx),
      })),
    ctx0
  );
  return {
    ...ctx0,
    session: {
      ...ctx1.session,
      reified: Duration.dateAdd(ctx1.session.reified, sinceReified(ctx1)),
    },
  };
}

export function tick<X extends SnapshotCtx<any>>(ctx: X, now?: Date): X {
  now = now ?? new Date();
  return { ...ctx, now };
}

export function unitIds<X extends Ctx<any>>(ctx: X): X["data"]["id"]["unit"][] {
  return Object.values(ctx.session.unit).map((u) => u.id);
}
export function unitCtxs<X extends Ctx<any>>(
  ctx: X
): (X & Unit.Ctx<X["data"]["id"]>)[] {
  return unitIds(ctx).map((unitId, i) => ({ ...ctx, unitId }));
}
