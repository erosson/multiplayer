import * as S from ".";
import * as Data from "../data";

const data = Data.create();
const now = new Date(0);
export const items: Record<string, S.T.SessionCtx> = {
  zero: {
    data,
    now,
    session: {
      started: now,
      updated: now,
      reified: now,
      unit: new Map(),
      autobuy: new Map(),
    },
  },
  empty: S.empty(data, now),
};
