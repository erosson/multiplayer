import { ID as ID_ } from "../schema";

export enum Unit {
  larva = "larva",
  hatchery = "hatchery",
  mineral = "mineral",
  drone = "drone",
  queen = "queen",
  nest = "nest",
}
export enum Upgrade {
  todo = "",
}
export enum Achievement {
  todo = "",
}

export type ID = ID_<typeof Unit, typeof Upgrade, typeof Achievement>;
export const ID: ID = { Unit, Upgrade, Achievement };
