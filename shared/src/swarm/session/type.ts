import * as S from "../schema";
import * as Data from "../data";

export interface Session {
  started: Date;
  reified: Date;
  updated: Date;
  unit: Map<S.UnitID, Unit>;
  autobuy: Map<S.UnitID, AutobuyOrder>;
}

export interface Unit {
  id: S.UnitID;
  count: number;
}
export interface AutobuyOrder {
  id: S.UnitID;
  count: number;
}

export interface SessionCtx {
  data: Data.Data;
  session: Session;
  now: Date;
}

export interface UnitCtx extends SessionCtx {
  unitId: S.UnitID;
}
