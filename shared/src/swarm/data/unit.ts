import * as S from "../schema";

/**
 * All unit ids as strings
 */
export const ids = ["larva", "hatchery", "mineral", "drone", "queen"] as const;

/**
 * All unit ids as string literals
 */
export type ID = (typeof ids)[number];

/**
 * All wrapped unit ids, indexed by string literal
 */
export const ID = Object.fromEntries(
  ids.map((k) => [k, S.UnitID.iso.wrap(k)])
) as { [K in ID]: S.UnitID };

/**
 * All unit definitions
 */
export const list: S.Unit[] = [
  { id: ID.larva, cost: [], prod: [] },
  {
    id: ID.hatchery,
    cost: [{ unit: ID.mineral, value: 300, factor: 10 }],
    prod: [{ unit: ID.larva, value: 1 }],
  },
  { id: ID.mineral, cost: [], prod: [] },
  {
    id: ID.drone,
    cost: [
      { unit: ID.larva, value: 1 },
      { unit: ID.mineral, value: 10 },
    ],
    prod: [{ unit: ID.mineral, value: 1 }],
  },
  {
    id: ID.queen,
    cost: [
      { unit: ID.larva, value: 1 },
      { unit: ID.drone, value: 100 },
    ],
    prod: [{ unit: ID.drone, value: 2 }],
  },
];

export const byId = Object.fromEntries(
  list.map((unit) => [S.UnitID.iso.unwrap(unit.id), unit])
) as {
  [K in ID]: S.Unit;
};
