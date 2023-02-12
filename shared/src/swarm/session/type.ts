import * as IO from "io-ts";
import * as IOT from "io-ts-types";
import { omit } from "lodash";
import * as Proto from "../../../dist/swarm/session/session";
import * as Data from "../data";
import * as S from "../schema";
import {
  ioIdentity,
  ioMapper,
  mapFromValues,
  protoCodec,
} from "../util/schema";
import * as P from "./progress";

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
export const Session = protoCodec(
  IO.type({
    // started: DateFromProto,
    // reified: DateFromProto,
    // updated: DateFromProto,
    started: IOT.DateFromISOString,
    reified: IOT.DateFromISOString,
    updated: IOT.DateFromISOString,
    unit: IO.array(Unit.codec).pipe(mapFromValues((v: Unit): S.UnitID => v.id)),
    autobuy: IO.array(AutobuyOrder.codec).pipe(
      mapFromValues((v: AutobuyOrder): S.UnitID => v.id)
    ),
    progress: IO.array(P.Progress.codec),
    complete: P.ProgressCompleteMap,
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

export const TickAction = protoCodec(
  ioMapper(
    IO.type({ type: IO.literal("tick") }),
    IO.type({}),
    (dec) => IO.success({ ...dec, type: "tick" as const }),
    (enc) => omit(enc, "type")
  ),
  Proto.TickAction
);
export interface TickAction extends IO.TypeOf<typeof TickAction.codec> {}

export const BuyAction = protoCodec(
  ioMapper(
    IO.type({
      type: IO.literal("buy"),
      unitId: ioIdentity(S.UnitID.codec.is),
      count: IO.number,
    }),
    IO.type({ unitId: IO.string, count: IO.number }),
    (dec) =>
      IO.success({
        ...dec,
        unitId: S.UnitID.wrap(dec.unitId),
        type: "buy" as const,
      }),
    (enc) => omit({ ...enc, unitId: S.UnitID.unwrap(enc.unitId) }, "type")
  ),
  Proto.BuyAction
);
export interface BuyAction extends IO.TypeOf<typeof BuyAction.codec> {}

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
  now?: Date;
}
