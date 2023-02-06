import * as S from "../schema";
import * as Duration from "../duration";
import * as Data from "../data";

export interface Session<I extends S.AnyID> {
  started: Date;
  reified: Date;
  updated: Date;
  unit: Record<S.UnitID<I>, Unit<I>>;
  autobuy: Record<S.UnitID<I>, AutobuyOrder<I>>;
}

export interface Unit<I extends S.AnyID> {
  id: S.UnitID<I>;
  count: number;
}
export interface AutobuyOrder<I extends S.AnyID> {
  id: S.UnitID<I>;
  count: number;
}

export interface DataCtx<I extends S.AnyID> {
  data: Data.Data<I>;
}
export interface SessionCtx<I extends S.AnyID> extends DataCtx<I> {
  session: Session<I>;
}
export interface SnapshotCtx<I extends S.AnyID> extends SessionCtx<I> {
  now: Date;
}
export interface UnitCtx<I extends S.AnyID> extends SessionCtx<I> {
  unitId: S.UnitID<I>;
}
