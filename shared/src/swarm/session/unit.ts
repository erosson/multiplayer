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

export function setCount<I extends S.AnyID, X extends Ctx<I>>(
  ctx: X,
  count: number
): X {
  return map<I, X>(ctx, (unit) => ({ ...unit, count }));
}
export function mapCount<I extends S.AnyID, X extends SnapshotCtx<I>>(
  ctx: X,
  fn: (c: number, ctx: X) => number
): X {
  return setCount<I, X>(ctx, fn(count(ctx), ctx));
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

export interface Buyable<I extends S.AnyID> {
  cost: CostBuyable<I>[];
  buyable: number;
  isBuyable: boolean;
}
export type CostBuyable<I extends S.AnyID> = {
  cost: S.Cost<I>;
  buyable: number;
};
export function buyable<I extends S.AnyID>(ctx: SnapshotCtx<I>): Buyable<I> {
  const cost = (schema(ctx).cost ?? []).map((cost): CostBuyable<I> => {
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
  const buyable = Math.min(...cost.map((c) => c.buyable));
  const isBuyable = cost.length > 0 && buyable >= 1;
  return { cost, isBuyable, buyable };
}

export interface BuyableVelocity<I extends S.AnyID> {
  cost: CostVelocity<I>[];
  velocity: number;
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
export function buyableVelocity<I extends S.AnyID>(
  ctx: SnapshotCtx<I>
): null | BuyableVelocity<I> {
  const cost_ = (schema(ctx).cost ?? []).map((cost): null | CostVelocity<I> => {
    const costCtx = { ...ctx, unitId: cost.unit };
    const v = velocity(costCtx);
    if (cost.factor == null) {
      return { cost, velocity: v / cost.value };
    } else {
      // exponential costs are not compatible with continuous purchasing
      return null;
    }
  });
  if (cost_.indexOf(null) < 0) {
    const cost = cost_ as CostVelocity<I>[];
    return { cost, velocity: Math.min(...cost.map((c) => c.velocity)) };
  }
  return null;
}

export function buy<I extends S.AnyID, X extends SnapshotCtx<I>>(
  ctx0: X,
  count_: number
): X {
  const b = buyable(ctx0);
  if (!b.isBuyable) {
    throw new Error(`!isBuyable: ${ctx0.unitId}`);
  }
  // cap at max buyable, and ensure integer
  count_ = Math.min(Math.floor(count_), Math.floor(b.buyable));
  // subtract cost units
  const ctx = (schema(ctx0).cost ?? []).reduce((ctx, cost): X => {
    if (cost.factor != null) {
      throw new Error("cost.factor not implemented");
    }
    ctx = { ...ctx, unitId: cost.unit };
    return mapCount<I, X>(ctx, (c) => c - cost.value * count_);
  }, ctx0);
  // add bought units
  return mapCount<I, X>({ ...ctx, unitId: ctx0.unitId }, (c) => c + count_);
}
