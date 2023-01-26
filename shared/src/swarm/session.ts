import * as IO from "io-ts";
import { Newtype } from "newtype-ts";
import * as ID from "./schema-id";
import * as S from "./schema";
import { isoCodec } from "./util/schema";
import * as Data from "./data";

export interface Session {
  started: Date;
  reified: ElapsedMs;
  updated: ElapsedMs;
  unit: { [s: string]: Unit };
}

export interface ElapsedMs
  extends Newtype<{ readonly ElapsedMs: unique symbol }, number> {}
export const ElapsedMs = isoCodec<ElapsedMs>(IO.string);

export interface Unit {
  id: ID.UnitID;
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
