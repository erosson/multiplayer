import * as I from "immer";
import * as Duration from "../duration";
import * as Poly from "../polynomial";
import * as Prod from "../production";
import * as S from "../schema";
import * as Session from "./session";
import * as T from "./type";
I.enableAllPlugins();

export type Ctx = T.UnitCtx;
export type ID = S.UnitID;
export type Schema = S.Unit;
export type Value = T.Unit;

export function empty(unit: Schema): Value {
  return {
    id: unit.id,
    count: unit.init ?? 0,
  };
}

export function context<X extends T.SessionCtx>(ctx: X, unitId: ID): X & Ctx {
  return { ...ctx, unitId };
}

export function getOrNull(ctx: Ctx): null | Value {
  return ctx.session.unit.get(ctx.unitId) ?? null;
}
export function get(ctx: Ctx): Value {
  const ret = getOrNull(ctx);
  if (ret == null) {
    throw new Error(`no such unit: ${ctx.unitId}`);
  }
  return ret;
}
export function schemaOrNull(ctx: Ctx): null | Schema {
  return ctx.data.unit.byId.get(ctx.unitId) ?? null;
}
export function schema(ctx: Ctx): Schema {
  const ret = schemaOrNull(ctx);
  if (ret == null) {
    throw new Error(`no such unit-schema: ${ctx.unitId}`);
  }
  return ret;
}
export function autobuyOrderOrNull(ctx: Ctx): null | T.AutobuyOrder {
  return ctx.session.autobuy.get(ctx.unitId) ?? null;
}

export function set<X extends Ctx>(ctx: X, val: Value): X {
  if (val.id !== ctx.unitId) {
    throw new Error(
      `unit.set: unit.id "${val.id}" doesn't match ctx.unitId "${ctx.unitId}"`
    );
  }
  return I.produce(ctx, (ctx) => {
    ctx.session.unit.set(val.id, val);
  });
}
export function map<X extends Ctx>(ctx: X, fn: (v: Value, ctx: X) => Value): X {
  return set(ctx, fn(get(ctx), ctx));
}

export function setCount<X extends Ctx>(ctx: X, count: number): X {
  return map(ctx, (unit) => ({ ...unit, count }));
}
export function mapCount<X extends Ctx>(
  ctx: X,
  fn: (c: number, ctx: X) => number
): X {
  return setCount(ctx, fn(count(ctx), ctx));
}

export function count0(ctx: Ctx): number {
  return get(ctx).count;
}

export function production(ctx: Ctx): Prod.Production {
  const ppaths = ctx.data.unit.producerGraph.childPaths.get(ctx.unitId) ?? [];
  const units = ppaths.map((ppath) => {
    const count = count0(context(ctx, ppath.producer.id));
    const production = ppath.path.map((path) => path.prod.value);
    return { count, production };
  });
  const avs = Session.autobuyVelocities(ctx);
  const velocitys = ppaths
    .map((ppath) => {
      const velocity = avs.get(ppath.producer.id);
      if (velocity === undefined) return null;
      const degree = ppath.path.length;
      return { velocity, degree };
    })
    .filter((p) => p != null) as Prod.ProductionVelocity[];
  return { units, velocitys };
}

export function polynomial(ctx: Ctx): Poly.Polynomial {
  return Prod.toPolynomial(production(ctx));
}

export function count(ctx: Ctx): number {
  const t = Session.sinceReified(ctx);
  return Poly.calc(polynomial(ctx), Duration.toSeconds(t));
}

export function velocity(ctx: Ctx): number {
  const t = Session.sinceReified(ctx);
  return Poly.calc(polynomial(ctx), Duration.toSeconds(t), 1);
}

export type Buyable =
  | {
      cost: CostBuyable[];
      buyable: number;
      isValid: true;
      isBuyable: boolean;
    }
  | { isValid: false; isBuyable: false };
export type CostBuyable = {
  cost: S.Cost;
  buyable: number;
};
export function buyable(ctx: Ctx): Buyable {
  const cost = (schema(ctx).cost ?? []).map((cost): CostBuyable => {
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

export type Autobuyable =
  | {
      cost: CostAutobuyableValid[];
      velocity: number;
      isValid: true;
      isAutobuyable: boolean;
    }
  | { cost: CostAutobuyable[]; isValid: false; isAutobuyable: false };
export interface CostAutobuyableValid {
  cost: S.Cost;
  velocity: number;
  isValid: true;
}
export interface CostAutobuyableInvalid {
  cost: S.Cost;
  isValid: false;
}
export type CostAutobuyable = CostAutobuyableValid | CostAutobuyableInvalid;
/**
 * The rate at which we can purchase this unit using only our current income, without any savings
 */
export function autobuyable(ctx: Ctx): Autobuyable {
  // how much can we autobuy for each cost?
  const cost_ = (schema(ctx).cost ?? []).map((cost): CostAutobuyable => {
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
  const cost = cost_ as CostAutobuyableValid[];
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

export function buy<X extends Ctx>(ctx: X, count_: number): X {
  return I.produce(Session.reify(ctx), (ctx) => {
    const b = buyable(ctx);
    if (!b.isBuyable) {
      throw new Error(`!isBuyable: ${ctx.unitId}`);
    }
    // cap at max buyable, and ensure integer
    count_ = Math.min(Math.floor(count_), Math.floor(b.buyable));
    // subtract cost units
    for (let cost of b.cost ?? []) {
      if (cost.cost.factor != null) {
        throw new Error("cost.factor not implemented");
      }
      get({ ...ctx, unitId: cost.cost.unit }).count -= cost.cost.value * count_;
    }
    // add bought units
    get({ ...ctx, unitId: ctx.unitId }).count += count_;
  });
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
export function autobuy<X extends Ctx>(ctx: X, count_: number): X {
  return I.produce(Session.reify(ctx), (ctx) => {
    if (count_ <= 0) {
      return autobuyClear(ctx);
    }
    const b = autobuyable(ctx);
    if (!b.isAutobuyable) {
      throw new Error(`!isAutobuyable: ${ctx.unitId}`);
    }
    // cap at max autobuyable. non-integers are fine
    count_ = Math.min(count_, b.velocity);
    // apply autobuy order
    const order: T.AutobuyOrder = {
      id: ctx.unitId,
      count: count_,
    };
    ctx.session.autobuy.set(order.id, order);
  });
}

export function autobuyClear<X extends Ctx>(ctx: X): X {
  return I.produce(Session.reify(ctx), (ctx) => {
    ctx.session.autobuy.delete(ctx.unitId);
  });
}
