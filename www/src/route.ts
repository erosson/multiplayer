import { UnitID } from "shared/src/swarm/schema";

export enum Route {
  home = "/",
  hello = "/hello",
  count = "/count",
  platform = "/platform",
  swarm = "/swarm",
  swarmJson = "/swarm/json",
  swarmAtlas = "/swarm/atlas/:nodeId?",
  swarmGraph = "/swarm/graph",
  swarmUnit = "/swarm/unit/:unitId",
}
export function swarmUnit(unitId: UnitID): string {
  return Route.swarmUnit.replace(":unitId", UnitID.unwrap(unitId));
}
export function swarmAtlas(nodeId: string = ""): string {
  return Route.swarmAtlas.replace(/\/:nodeId\?/, nodeId ? `/${nodeId}` : "");
}
