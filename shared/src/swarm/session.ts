import * as S from "./schema";
import * as Data from "./data";
import * as Prod from "./production";
import * as Poly from "./polynomial";
import * as Duration from "./duration";

export interface Session<I extends S.AnyID> {
  data: Data.Data<I>;
  started: Date;
  reified: Duration.T;
  updated: Duration.T;
  unit: { [K in S.UnitID<I>]: Unit<I> };
}

export interface Unit<I extends S.AnyID> {
  id: S.UnitID<I>;
  count: number;
}

/**
 * All persistent player data
 */
// export const Session = IO.type(
// {
// started: IOT.DateFromISOString,
// reified: IOT.DateFromISOString,
// updated: IOT.DateFromISOString,
// unit: IO.record(ID.UnitID.codec, IO.number),
// },
// "Session"
// );
// export type Session = IO.TypeOf<typeof Session>;

export function create<I extends S.AnyID>(
  data: Data.Data<I>,
  now?: Date
): Session<I> {
  now = now ?? new Date();
  const session = {
    data,
    started: now,
    reified: Duration.zero,
    updated: Duration.zero,
    // TODO we should omit units that aren't yet in play, right?
    unit: Object.fromEntries(
      Object.values<S.UnitID<I>>(data.unit.list).map((u) => [
        u.id,
        createUnit(u),
      ])
    ),
  };
  return session;
}

function createUnit<I extends S.AnyID>(unit: S.Unit<I>): Unit<I> {
  return {
    id: unit.id,
    count: unit.init ?? 0,
  };
}

export function getUnit<I extends S.AnyID>(
  session: Session<I>,
  id: S.UnitID<I>
): Unit<I> {
  return id in session.unit
    ? session.unit[id]
    : createUnit(session.data.unit[id]);
}

export function setUnit<I extends S.AnyID>(
  session: Session<I>,
  val: Unit<I>
): Session<I>;
export function setUnit<I extends S.AnyID>(
  session: Session<I>,
  id: S.UnitID<I>,
  val: (v: S.Unit<I>) => Unit<I>
): Session<I>;
export function setUnit<I extends S.AnyID>(
  session: Session<I>,
  idOrVal: S.UnitID<I> | Unit<I>,
  fn?: (v: Unit<I>) => Unit<I>
): Session<I> {
  if (fn) {
    const id = idOrVal as S.UnitID<I>;
    return {
      ...session,
      unit: { ...session.unit, [id]: fn(getUnit(session, id)) },
    };
  } else {
    const val = idOrVal as S.Unit<I>;
    return { ...session, unit: { ...session.unit, [val.id]: val } };
  }
}

export function unitCount0<I extends S.AnyID>(
  session: Session<I>,
  id: S.UnitID<I>
): number {
  return getUnit(session, id).count;
}

export function unitProduction<I extends S.AnyID>(
  session: Session<I>,
  id: S.UnitID<I>
): Prod.Production {
  const ppaths = session.data.unit.producerGraph.childPaths[id] ?? [];
  const units = ppaths.map((ppath) => {
    const count = unitCount0(session, ppath.producer.id);
    const production = ppath.path.map((path) => path.prod.value);
    return { count, production };
  });
  // TODO velocities
  return { units, velocitys: [] };
}

export function unitPolynomial<I extends S.AnyID>(
  session: Session<I>,
  id: S.UnitID<I>
): Poly.Polynomial {
  return Prod.toPolynomial(unitProduction(session, id));
}

export function reifiedElapsed<I extends S.AnyID>(
  session: Session<I>,
  nowOrElapsed: Date | Duration.T
): Duration.T {
  if (nowOrElapsed instanceof Date) {
    const total = Duration.between({
      before: session.started,
      after: nowOrElapsed,
    });
    return Duration.sub(total, session.reified);
  }
  return nowOrElapsed;
}

export function unitCount<I extends S.AnyID>(
  session: Session<I>,
  id: S.UnitID<I>,
  nowOrElapsed: Date | Duration.T
): number {
  const t: Duration.T = reifiedElapsed(session, nowOrElapsed);
  return Poly.calc(unitPolynomial(session, id), Duration.toSeconds(t));
}

export function unitVelocity<I extends S.AnyID>(
  session: Session<I>,
  id: S.UnitID<I>,
  nowOrElapsed: Date | Duration.T
): number {
  const t: Duration.T = reifiedElapsed(session, nowOrElapsed);
  return Poly.calc(unitPolynomial(session, id), Duration.toSeconds(t), 1);
}

export function reify<I extends S.AnyID>(
  session: Session<I>,
  nowOrElapsed: Date | Duration.T
): Session<I> {
  const dt: Duration.T = reifiedElapsed(session, nowOrElapsed);
  const session1: Session<I> = session.data.unit.list.reduce(
    (s, { id }) =>
      setUnit(s, id, (u) => ({
        ...u,
        count: unitCount(session, id, dt),
      })),
    session
  );
  return {
    ...session1,
    reified: Duration.add(session.reified, dt),
  };
}

export function costBuyable<I extends S.AnyID>(
  session: Session<I>,
  cost: S.Cost<I>,
  elapsed: Duration.T
): number {
  const bank = unitCount(session, cost.unit, elapsed);
  if (cost.factor == null) {
    return bank / cost.value;
  } else {
    // https://en.wikipedia.org/wiki/Geometric_progression#Geometric_series
    // unit.count = cost.val (1 - cost.factor ^ maxAffordable) / (1 - cost.factor)
    // solve for maxAffordable:
    // unit.count * (1 - cost.factor) = cost.val (1 - cost.factor ^ maxAffordable)
    // unit.count * (1 - cost.factor) / cost.val = 1 - cost.factor ^ maxAffordable
    // cost.factor ^ maxAffordable = 1 - unit.count * (1 - cost.factor) / cost.val
    // maxAffordable * ln cost.factor = ln (1 - unit.count * (1 - cost.factor) / cost.val)
    // maxAffordable = (log (1 - (unit.count * (1 - cost.factor) / cost.val))) / (log cost.factor)
    return (
      Math.log(1 - (bank * (1 - cost.factor)) / cost.value) /
      Math.log(cost.factor)
    );
  }
}

export function costBuyableVelocity<I extends S.AnyID>(
  session: Session<I>,
  cost: S.Cost<I>,
  elapsed: Duration.T
): number {
  const velocity = unitVelocity(session, cost.unit, elapsed);
  if (cost.factor == null) {
    return velocity / cost.value;
  } else {
    // exponential costs are not compatible with continuous purchasing
    return 0;
  }
}
