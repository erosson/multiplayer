import * as IO from "io-ts";
import { Newtype } from "newtype-ts";
import * as S from "./schema";
import { isoCodec } from "./util/schema";
import * as Data from "./data";
import * as Prod from "./production";
import * as Poly from "./polynomial";
import { product } from "./util/math";

export interface Session<I extends S.AnyID> {
  data: Data.Data<I>;
  started: Date;
  reified: ElapsedMs;
  updated: ElapsedMs;
  unit: { [K in S.UnitID<I>]: Unit<I> };
}

export interface ElapsedMs
  extends Newtype<{ readonly ElapsedMs: unique symbol }, number> {}
export const ElapsedMs = isoCodec<ElapsedMs>(IO.string);

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
  return {
    data,
    started: now,
    reified: ElapsedMs.iso.wrap(0),
    updated: ElapsedMs.iso.wrap(0),
    // TODO we should omit units that aren't yet in play, right?
    unit: Object.fromEntries(
      Object.values<S.UnitID<I>>(data.id.Unit).map((id) => [id, createUnit(id)])
    ),
  };
}

function createUnit<I extends S.AnyID>(unit: S.Unit<I>): Unit<I> {
  return {
    id: unit.id,
    count: unit.init ?? 0,
  };
}

export function unitCount0<I extends S.AnyID>(
  session: Session<I>,
  id: S.UnitID<I>
): number {
  return session.unit[id].count;
}

export function unitProduction<I extends S.AnyID>(
  session: Session<I>,
  id: S.UnitID<I>
): Prod.Production {
  const ppaths = session.data.unit.producerGraph.childPaths[id];
  return ppaths.map((ppath) => {
    const count = unitCount0(session, ppath.producer.id);
    const production = product(ppath.path.map((path) => path.prod.value));
    return { count, production };
  });
}

export function unitPolynomial<I extends S.AnyID>(
  session: Session<I>,
  id: S.UnitID<I>
): Poly.Polynomial {
  return Prod.toPolynomial(
    unitCount0(session, id),
    unitProduction(session, id)
  );
}

export function toElapsed(d: { before: Date; after: Date }): ElapsedMs {
  return ElapsedMs.iso.wrap(d.after.getTime() - d.before.getTime());
}

export function sinceElapsed(date: Date, elapsed: ElapsedMs): Date {
  return new Date(date.getTime() + ElapsedMs.iso.unwrap(elapsed));
}

export function addElapsed(a: ElapsedMs, b: ElapsedMs): ElapsedMs {
  return ElapsedMs.iso.wrap(ElapsedMs.iso.unwrap(a) + ElapsedMs.iso.unwrap(b));
}
export function subElapsed(a: ElapsedMs, b: ElapsedMs): ElapsedMs {
  return ElapsedMs.iso.wrap(ElapsedMs.iso.unwrap(a) - ElapsedMs.iso.unwrap(b));
}

export function reifiedElapsed<I extends S.AnyID>(
  session: Session<I>,
  now: Date
): ElapsedMs {
  const total = toElapsed({ before: session.started, after: now });
  return subElapsed(total, session.reified);
}
export function elapsedSeconds(a: ElapsedMs): number {
  return ElapsedMs.iso.unwrap(a) / 1000;
}

export function unitCount<I extends S.AnyID>(
  session: Session<I>,
  id: S.UnitID<I>,
  now: Date
): number {
  return unitCountElapsed(session, id, reifiedElapsed(session, now));
}
export function unitCountElapsed<I extends S.AnyID>(
  session: Session<I>,
  id: S.UnitID<I>,
  t: ElapsedMs
): number {
  return Poly.calc(unitPolynomial(session, id), elapsedSeconds(t));
}

export function elapsedMs(ms: number): ElapsedMs {
  return ElapsedMs.iso.wrap(ms);
}

export function reify<I extends S.AnyID>(
  session: Session<I>,
  now: Date
): Session<I> {
  const reified = toElapsed({ before: session.started, after: now });
  const dt = subElapsed(reified, session.reified);
  return {
    ...session,
    reified,
    unit: Object.fromEntries(
      Object.values<Unit<I>>(session.unit).map((u) => [
        u.id,
        { ...u, count: unitCountElapsed(session, u.id, dt) },
      ])
    ),
  };
}
