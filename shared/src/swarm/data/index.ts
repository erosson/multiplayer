import { mapKeyBy, mapTagBy } from "../util/schema";
import * as G from "./graph";
import * as S from "../schema";
import Unit from "./unit";

/**
 * Game data. Unit types, etc.
 *
 * Lots of redundancy. Lots of indexes for efficient data access.
 */
export interface Data {
  raw: Raw;
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

/**
 * Raw game data, with no indexes. Used to create `Data` and its indexes.
 */
export interface Raw {
  units: readonly S.Unit[];
}

export const raw: Readonly<Raw> = {
  units: Unit,
};

export function baseCreate(raw: Readonly<Raw>): Data {
  const { units } = raw;
  return {
    raw,
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
  return baseCreate(raw);
}
