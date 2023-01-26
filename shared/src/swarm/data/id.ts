import { keyBy } from "../util/schema";
import * as S from "../schema-id";

/**
 * All unit ids as strings
 */
export const units = [
  "larva",
  "hatchery",
  "mineral",
  "drone",
  "queen",
] as const;

/**
 * All unit ids as string literals
 */
export type Unit = (typeof units)[number];

/**
 * All wrapped unit ids, indexed by string literal
 */
export const Unit = keyBy(
  units.map(S.UnitID.iso.wrap),
  (id) => S.UnitID.iso.unwrap(id) as Unit
);
