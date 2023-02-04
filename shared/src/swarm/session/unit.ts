import * as S from "../schema";
import * as Data from "../data";
import * as Session from "./session";
import * as Duration from "../duration";
import * as Prod from "../production";
import * as Poly from "../polynomial";
import * as T from "./type";

export type Ctx<I extends S.AnyID> = T.UnitCtx<I>;
export type SnapshotCtx<I extends S.AnyID> = Ctx<I> & T.SnapshotCtx<I>;
export type ID<I extends S.AnyID> = S.UnitID<I>;
export type Schema<I extends S.AnyID> = S.Unit<I>;
export type Value<I extends S.AnyID> = T.Unit<I>;

export function empty<I extends S.AnyID>(unit: Schema<I>): Value<I> {
  return {
    id: unit.id,
    count: unit.init ?? 0,
  };
}

export function context<I extends S.AnyID, X extends T.SessionCtx<I>>(
  ctx: X,
  unitId: ID<I>
): X & Ctx<I> {
  return { ...ctx, unitId };
}

export function getOrNull<I extends S.AnyID>(ctx: Ctx<I>): null | Value<I> {
  return ctx.session.unit[ctx.unitId] ?? null;
}
export function get<I extends S.AnyID>(ctx: Ctx<I>): Value<I> {
  const ret = getOrNull(ctx);
  if (ret == null) {
    throw new Error(`no such unit: ${ctx.unitId}`);
  }
  return ret;
}
export function schemaOrNull<I extends S.AnyID>(ctx: Ctx<I>): null | Schema<I> {
  return ctx.data.unit.byId[ctx.unitId] ?? null;
}
export function schema<I extends S.AnyID>(ctx: Ctx<I>): Schema<I> {
  const ret = schemaOrNull(ctx);
  if (ret == null) {
    throw new Error(`no such unit-schema: ${ctx.unitId}`);
  }
  return ret;
}

export function set<I extends S.AnyID, X extends Ctx<I>>(
  ctx: X,
  val: Value<I>
): X {
  if (val.id !== ctx.unitId) {
    throw new Error(
      `unit.set: unit.id "${val.id}" doesn't match ctx.unitId "${ctx.unitId}"`
    );
  }
  return {
    ...ctx,
    session: { ...ctx.session, unit: { ...ctx.session.unit, [val.id]: val } },
  };
}
export function map<I extends S.AnyID, X extends Ctx<I>>(
  ctx: X,
  fn: (v: Value<I>, ctx: X) => Value<I>
): X {
  return set(ctx, fn(get(ctx), ctx));
}

export function count0<I extends S.AnyID>(ctx: Ctx<I>): number {
  return get(ctx).count;
}

export function production<I extends S.AnyID>(ctx: Ctx<I>): Prod.Production {
  const ppaths = ctx.data.unit.producerGraph.childPaths[ctx.unitId] ?? [];
  const units = ppaths.map((ppath) => {
    const count = count0(context(ctx, ppath.producer.id));
    const production = ppath.path.map((path) => path.prod.value);
    return { count, production };
  });
  // TODO velocities
  return { units, velocitys: [] };
}

export function polynomial<I extends S.AnyID>(ctx: Ctx<I>): Poly.Polynomial {
  return Prod.toPolynomial(production(ctx));
}

export function count<I extends S.AnyID>(ctx: SnapshotCtx<I>): number {
  const t = Session.sinceReified(ctx);
  return Poly.calc(polynomial(ctx), Duration.toSeconds(t));
}

export function velocity<I extends S.AnyID>(ctx: SnapshotCtx<I>): number {
  const t = Session.sinceReified(ctx);
  return Poly.calc(polynomial(ctx), Duration.toSeconds(t), 1);
}

export type CostBuyable<I extends S.AnyID> = {
  cost: S.Cost<I>;
  buyable: number;
};
export function costBuyable<I extends S.AnyID>(
  ctx: SnapshotCtx<I>
): CostBuyable<I>[] {
  return (schema(ctx).cost ?? []).map((cost): CostBuyable<I> => {
    const costCtx = { ...ctx, unitId: cost.unit };
    const bank = count(costCtx);
    if (cost.factor == null) {
      return { cost, buyable: bank / cost.value };
    } else {
      // https://en.wikipedia.org/wiki/Geometric_progression#Geometric_series
      // unit.count = cost.val (1 - cost.factor ^ maxAffordable) / (1 - cost.factor)
      // solve for maxAffordable:
      // unit.count * (1 - cost.factor) = cost.val (1 - cost.factor ^ maxAffordable)
      // unit.count * (1 - cost.factor) / cost.val = 1 - cost.factor ^ maxAffordable
      // cost.factor ^ maxAffordable = 1 - unit.count * (1 - cost.factor) / cost.val
      // maxAffordable * ln cost.factor = ln (1 - unit.count * (1 - cost.factor) / cost.val)
      // maxAffordable = (log (1 - (unit.count * (1 - cost.factor) / cost.val))) / (log cost.factor)
      return {
        cost,
        buyable:
          Math.log(1 - (bank * (1 - cost.factor)) / cost.value) /
          Math.log(cost.factor),
      };
    }
  });
}

export type CostVelocity<I extends S.AnyID> = {
  cost: S.Cost<I>;
  velocity: number;
};
/**
 * The rate at which we can purchase this unit using only our current income, without any savings
 *
 * `null` means that the unit can't be purchases this way - for example, any nonlinear costs
 */
export function costBuyableVelocity<I extends S.AnyID>(
  ctx: SnapshotCtx<I>
): null | CostVelocity<I>[] {
  const vs = (schema(ctx).cost ?? []).map((cost): null | CostVelocity<I> => {
    const costCtx = { ...ctx, unitId: cost.unit };
    const v = velocity(costCtx);
    if (cost.factor == null) {
      return { cost, velocity: v / cost.value };
    } else {
      // exponential costs are not compatible with continuous purchasing
      return null;
    }
  });
  return vs.indexOf(null) < 0 ? (vs as CostVelocity<I>[]) : null;
}
