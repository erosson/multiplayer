import * as S from "../schema";
import * as Data from "../data";
import * as Proto from "../../../dist/swarm/session/session";
// import { Timestamp as ProtoTimestamp } from "../../../dist/google/protobuf/timestamp";
import * as IO from "io-ts";
import { mapFromValues, protoCodec } from "../util/schema";
import { DateFromISOString } from "io-ts-types";

export const Unit = protoCodec(
  IO.type({
    id: S.UnitID.codec,
    count: IO.number,
  }),
  Proto.Unit
);
export interface Unit extends IO.TypeOf<typeof Unit.codec> {}

export const AutobuyOrder = protoCodec(
  IO.type({
    id: S.UnitID.codec,
    count: IO.number,
  }),
  Proto.AutobuyOrder
);
export interface AutobuyOrder extends IO.TypeOf<typeof AutobuyOrder.codec> {}

// export const DateFromProto = new IO.Type<Date, ProtoTimestamp>(
// "DateFromProto",
// (date): date is Date => date instanceof Date,
// (proto) => IO.success(ProtoTimestamp.toDate(proto as any)),
// (date) => ProtoTimestamp.fromDate(date)
// );

// export interface Session {
// started: Date;
// reified: Date;
// updated: Date;
// unit: Map<S.UnitID, Unit>;
// autobuy: Map<S.UnitID, AutobuyOrder>;
// }
export const Session = protoCodec(
  IO.type({
    // started: DateFromProto,
    // reified: DateFromProto,
    // updated: DateFromProto,
    started: DateFromISOString,
    reified: DateFromISOString,
    updated: DateFromISOString,
    unit: IO.array(Unit.codec).pipe(mapFromValues((v: Unit): S.UnitID => v.id)),
    autobuy: IO.array(AutobuyOrder.codec).pipe(
      mapFromValues((v: AutobuyOrder): S.UnitID => v.id)
    ),
  }),
  Proto.Session
);
export interface Session extends IO.TypeOf<typeof Session.codec> {}
// export type Session = IO.TypeOf<typeof Session.codec>;

export interface SessionCtx {
  data: Data.Data;
  session: Session;
  now: Date;
}

export interface UnitCtx extends SessionCtx {
  unitId: S.UnitID;
}
