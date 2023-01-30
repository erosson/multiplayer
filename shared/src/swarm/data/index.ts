import { keyBy, tagBy } from "../util/schema.js";
import * as G from "./graph.js";
import * as S from "../schema.js";
import { ID } from "./id.js";
import unitData from "./unit.js";

export interface Data<I extends S.AnyID> {
  id: I;
  unit: UnitData<I>;
}

export interface UnitData<I extends S.AnyID> {
  list: readonly S.Unit<I>[];
  byId: Record<S.UnitID<I>, S.Unit<I>>;
  byProducers: Record<S.UnitID<I>, readonly S.Unit<I>[]>;
  producerGraph: G.ProducerGraph<I>;
  byCost: Record<S.UnitID<I>, readonly S.Unit<I>[]>;
  byRequire: Record<S.UnitID<I>, readonly S.Unit<I>[]>;
}

export interface AnyID extends Data<S.AnyID> {}
export type UnitID<C extends AnyID> = S.UnitID<C["id"]>;
export type UpgradeID<C extends AnyID> = S.UpgradeID<C["id"]>;
export type AchievementID<C extends AnyID> = S.AchievementID<C["id"]>;

export function baseCreate<I extends S.AnyID>(
  id: I,
  units: readonly S.Unit<I>[]
): Data<I> {
  return {
    id,
    unit: {
      list: units,
      byId: keyBy(units, (unit) => unit.id),
      byProducers: tagBy(
        Object.values(id.Unit),
        units,
        (u) => u.prod?.map((c) => c.unit) ?? []
      ),
      producerGraph: G.producer<I>(units),
      byCost: tagBy(
        Object.values(id.Unit),
        units,
        (u) => u.cost?.map((c) => c.unit) ?? []
      ),
      byRequire: tagBy(
        Object.values(id.Unit),
        units,
        (u) =>
          u.require?.flatMap((r) =>
            r.id.type === "unit" ? [r.id.unit] : []
          ) ?? []
      ),
    },
  };
}

export function create(): Data<ID> {
  return baseCreate(ID, unitData);
}
