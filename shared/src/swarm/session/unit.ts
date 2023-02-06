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
export function autobuyOrderOrNull<I extends S.AnyID>(
  ctx: Ctx<I>
): T.AutobuyOrder<I> {
  return ctx.session.autobuy[ctx.unitId] ?? null;
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
  const avs = Session.autobuyVelocities(ctx);
  const velocitys = ppaths
    .map((ppath) => {
      if (!(ppath.producer.id in avs)) return null;
      const velocity = avs[ppath.producer.id];
      const degree = ppath.path.length;
      return { velocity, degree };
    })
    .filter((p) => p != null) as Prod.ProductionVelocity[];
  return { units, velocitys };
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

export type Buyable<I extends S.AnyID> =
  | {
      cost: CostBuyable<I>[];
      buyable: number;
      isValid: true;
      isBuyable: boolean;
    }
  | { isValid: false; isBuyable: false };
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
  const isValid = cost.length > 0;
  if (!isValid) {
    return { isValid: false, isBuyable: false };
  }
  const buyable = Math.min(...cost.map((c) => c.buyable));
  // unbuyable if no costs listed, or if we can't afford one
  const isBuyable = isValid && buyable >= 1;
  return { cost, isValid, isBuyable, buyable };
}

export type Autobuyable<I extends S.AnyID> =
  | {
      cost: CostAutobuyableValid<I>[];
      velocity: number;
      isValid: true;
      isAutobuyable: boolean;
    }
  | { cost: CostAutobuyable<I>[]; isValid: false; isAutobuyable: false };
export interface CostAutobuyableValid<I extends S.AnyID> {
  cost: S.Cost<I>;
  velocity: number;
  isValid: true;
}
export interface CostAutobuyableInvalid<I extends S.AnyID> {
  cost: S.Cost<I>;
  isValid: false;
}
export type CostAutobuyable<I extends S.AnyID> =
  | CostAutobuyableValid<I>
  | CostAutobuyableInvalid<I>;
/**
 * The rate at which we can purchase this unit using only our current income, without any savings
 */
export function autobuyable<I extends S.AnyID>(
  ctx: SnapshotCtx<I>
): Autobuyable<I> {
  // how much can we autobuy for each cost?
  const cost_ = (schema(ctx).cost ?? []).map((cost): CostAutobuyable<I> => {
    const costCtx = { ...ctx, unitId: cost.unit };
    const v = velocity(costCtx);
    if (cost.factor == null) {
      return { cost, velocity: v / cost.value, isValid: true };
    } else {
      // nonlinear costs are not compatible with autobuy
      return { cost, isValid: false };
    }
  });
  if (cost_.find((c) => !c.isValid)) {
    // no autobuy for units with exponential costs
    return { cost: [], isAutobuyable: false, isValid: false };
  }
  const buyable_ = buyable(ctx);
  const count_ = count(ctx);
  const cost = cost_ as CostAutobuyableValid<I>[];
  // autobuyable velocity includes existing autobuy order, because a new autobuy will overwrite it
  const av = autobuyOrderOrNull(ctx)?.count ?? 0;
  const v = av + Math.min(...cost.map((c) => c.velocity));
  // unbuyable if no costs listed, or if we don't have one and can't afford one, or if velocity is too low
  const isValid = buyable_.isValid && cost.length > 0;
  if (!isValid) {
    return { cost, isValid: false, isAutobuyable: false };
  }
  const isAutobuyable =
    isValid && (count_ >= 1 || buyable_.buyable >= 1) && v >= 0.1;
  return { cost, velocity: v, isAutobuyable, isValid };
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
  ctx0 = Session.reify<X["data"]["id"], X>(ctx0);
  const ctx = (b.cost.map((c) => c.cost) ?? []).reduce((ctx, cost): X => {
    if (cost.factor != null) {
      throw new Error("cost.factor not implemented");
    }
    ctx = { ...ctx, unitId: cost.unit };
    return mapCount<I, X>(ctx, (c) => c - cost.value * count_);
  }, ctx0);
  // add bought units
  return mapCount<I, X>({ ...ctx, unitId: ctx0.unitId }, (c) => c + count_);
}

/**
 * TODO autobuy:
 * - autobuy quantity slider
 * - autobuying x when you have zero x should actually buy the first one. (unit counts between 0 and 1 are very weird; decimals are possible but less weird for larger numbers)
 * - autobuy 1 drone/sec. (manual)buy a queen @ 100 drones. you now have 0 drones/0 mineral income, while still spending minerals (autobuying drones). negative minerals possible!
 *   - prevent buy if it would cause any negative income; increase all relevant purchase requirements
 *   - buy cancels autobuys if it causes negative income
 *   - calculate: will this buy cause negative bank? allow only if not
 * - we really need to trim more decimals in the ui
 */
export function autobuy<I extends S.AnyID, X extends SnapshotCtx<I>>(
  ctx: X,
  count_: number
): X {
  if (count_ <= 0) {
    return autobuyClear<I, X>(ctx);
  }
  const b = autobuyable(ctx);
  if (!b.isAutobuyable) {
    throw new Error(`!isAutobuyable: ${ctx.unitId}`);
  }
  ctx = Session.reify<I, X>(ctx);
  // cap at max autobuyable. non-integers are fine
  count_ = Math.min(count_, b.velocity);
  // apply autobuy order
  const order: T.AutobuyOrder<X["data"]["id"]> = {
    id: ctx.unitId,
    count: count_,
  };
  return {
    ...ctx,
    session: {
      ...ctx.session,
      autobuy: { ...ctx.session.autobuy, [order.id]: order },
    },
  };
}

export function autobuyClear<I extends S.AnyID, X extends SnapshotCtx<I>>(
  ctx: X
): X {
  ctx = {
    ...ctx,
    session: {
      ...ctx.session,
      autobuy: { ...ctx.session.autobuy },
    },
  };
  delete ctx.session.autobuy[ctx.unitId];
  return ctx;
}
