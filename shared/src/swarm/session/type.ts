import * as Proto from "../../../dist/swarm/session/session";
import * as Data from "../data";
import * as S from "../schema";
// import { Timestamp as ProtoTimestamp } from "../../../dist/google/protobuf/timestamp";
import * as IO from "io-ts";
import { DateFromISOString } from "io-ts-types";
import { mapFromValues, protoCodec } from "../util/schema";
import * as Progress from "./progress";

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
  undo: Session;
  now: Date;
  progress: Progress.Results;
}

export interface UnitCtx extends SessionCtx {
  unitId: S.UnitID;
}

// actions

export type Action =
  | TickAction
  | BuyAction
  | AutobuyAction
  | UndoAction
  | DebugSetSessionAction;

export interface TickAction {
  type: "tick";
}

export interface BuyAction {
  type: "buy";
  unitId: S.UnitID;
  count: number;
}

export interface AutobuyAction {
  type: "autobuy";
  unitId: S.UnitID;
  count: number;
}

export interface UndoAction {
  type: "undo";
}

export interface DebugSetSessionAction {
  type: "debug-set-session";
  session: Session;
  progress?: Progress.Results;
  now?: Date;
}
