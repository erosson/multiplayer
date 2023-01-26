import { keyBy, tagBy } from "../util/schema";
import * as ID from "./id";
import * as SI from "../schema-id";
import * as G from "./graph";
import units from "./unit";

// within this file, I trust that our data-ids match their types
function unwrap(id: SI.UnitID): ID.Unit;
function unwrap(id: any) {
  return id;
}

export const Unit = {
  list: units,
  byId: keyBy(units, (unit) => unwrap(unit.id)),
  byProducers: tagBy(
    ID.units,
    units,
    (u) => u.prod?.map((c) => unwrap(c.unit)) ?? []
  ),
  producerPaths: G.producer().childPaths,
  byCost: tagBy(
    ID.units,
    units,
    (u) => u.cost?.map((c) => unwrap(c.unit)) ?? []
  ),
  byRequire: tagBy(
    ID.units,
    units,
    (u) =>
      u.require?.flatMap((r) =>
        r.id.type === "unit" ? [unwrap(r.id.unit)] : []
      ) ?? []
  ),
};
