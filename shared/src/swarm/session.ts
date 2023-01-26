import * as IO from "io-ts";
import { Newtype } from "newtype-ts";
import * as SID from "./schema-id";
import * as DID from "./data/id";
import * as S from "./schema";
import { isoCodec } from "./util/schema";
import * as Data from "./data";
import { ProducerPath } from "./data/graph";
import * as Prod from "./production";
import * as Poly from "./polynomial";
import { product } from "./util/math";

export interface Session {
  started: Date;
  reified: ElapsedMs;
  updated: ElapsedMs;
  unit: { [K in DID.Unit]: Unit };
}

export interface ElapsedMs
  extends Newtype<{ readonly ElapsedMs: unique symbol }, number> {}
export const ElapsedMs = isoCodec<ElapsedMs>(IO.string);

export interface Unit {
  id: SID.UnitID;
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

export function create(now?: Date): Session {
  now = now ?? new Date();
  return {
    started: now,
    reified: ElapsedMs.iso.wrap(0),
    updated: ElapsedMs.iso.wrap(0),
    // TODO we should omit units that aren't yet in play, right?
    unit: Object.fromEntries(Data.Unit.list.map((u) => [u.id, createUnit(u)])),
  };
}

function createUnit(unit: S.Unit): Unit {
  return {
    id: unit.id,
    count: unit.init ?? 0,
  };
}

export function unitCount0(session: Session, id: SID.UnitID): number {
  const id_ = SID.UnitID.iso.unwrap(id);
  return session.unit[id_].count;
}
export function unitProduction(
  session: Session,
  id: SID.UnitID
): Prod.Production {
  const id_ = SID.UnitID.iso.unwrap(id);
  const ppaths: ProducerPath[] = Data.Unit.producerPaths[id_];
  return ppaths.map((ppath) => {
    const count = unitCount0(session, ppath.producer.id);
    const production = product(ppath.path.map((path) => path.prod.value));
    return { count, production };
  });
}

export function unitPolynomial(
  session: Session,
  id: SID.UnitID
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

export function reifiedElapsed(session: Session, now: Date): ElapsedMs {
  const total = toElapsed({ before: session.started, after: now });
  return subElapsed(total, session.reified);
}
export function elapsedSeconds(a: ElapsedMs): number {
  return ElapsedMs.iso.unwrap(a) / 1000;
}

export function unitCount(session: Session, id: SID.UnitID, now: Date): number {
  return unitCountElapsed(session, id, reifiedElapsed(session, now));
}
export function unitCountElapsed(
  session: Session,
  id: SID.UnitID,
  t: ElapsedMs
): number {
  return Poly.calc(unitPolynomial(session, id), elapsedSeconds(t));
}

export function elapsedMs(ms: number): ElapsedMs {
  return ElapsedMs.iso.wrap(ms);
}

export function reify(session: Session, now: Date): Session {
  const reified = toElapsed({ before: session.started, after: now });
  const dt = subElapsed(reified, session.reified);
  return {
    ...session,
    reified,
    unit: Object.fromEntries(
      Object.values(session.unit).map((u) => [
        u.id,
        { ...u, count: unitCountElapsed(session, u.id, dt) },
      ])
    ),
  };
}

// export function unitProductions(
// session: Session
// ): Record<DID.Unit, Production> {
// return Object.fromEntries(
// Object.values(DID.Unit).map((id) => [id, unitProduction(session, id)])
// ) as Record<DID.Unit, Production>;
// }
