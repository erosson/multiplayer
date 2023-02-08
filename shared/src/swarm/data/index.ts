import { mapKeyBy, mapTagBy } from "../util/schema";
import * as G from "./graph";
import * as S from "../schema";
import unitData from "./unit";

export interface Data {
  unit: UnitData;
}

export interface UnitData {
  list: readonly S.Unit[];
  byId: Map<S.UnitID, S.Unit>;
  byProducers: Map<S.UnitID, readonly S.Unit[]>;
  producerGraph: G.ProducerGraph;
  byCost: Map<S.UnitID, readonly S.Unit[]>;
  byRequire: Map<S.UnitID, readonly S.Unit[]>;
}

export function baseCreate(units: readonly S.Unit[]): Data {
  return {
    unit: {
      list: units,
      byId: mapKeyBy(units, (u) => u.id),
      byProducers: mapTagBy(units, (u) => u.prod?.map((c) => c.unit) ?? []),
      producerGraph: G.producer(units),
      byCost: mapTagBy(units, (u) => u.cost?.map((c) => c.unit) ?? []),
      byRequire: mapTagBy(
        units,
        (u) =>
          u.require?.flatMap((r) =>
            r.id.type === "unit" ? [r.id.unit] : []
          ) ?? []
      ),
    },
  };
}

export function create(): Data {
  return baseCreate(unitData);
}
