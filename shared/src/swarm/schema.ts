import * as ID from "./schema-id";

// IDs need codecs, but non-IDs don't. We're hardcoding game data, not decoding
// from a spreadsheet or file. No real value in a spreadsheet, and simpler types
export interface Unit {
  id: ID.UnitID;
  init?: number;
  cost?: Cost[];
  prod?: Prod[];
  require?: Require[];
}

export interface Upgrade {
  id: ID.UpgradeID;
  cost?: Cost[];
  require?: Require[];
}

export interface Achievement {
  id: ID.AchievementID;
  visible: Require[];
}

export interface Cost {
  unit: ID.UnitID;
  value: number;
  factor?: number;
}

export interface Prod {
  unit: ID.UnitID;
  value: number;
}

interface UnitIDType {
  type: "unit";
  unit: ID.UnitID;
}
interface UpgradeIDType {
  type: "upgrade";
  upgrade: ID.UpgradeID;
}

export interface Require {
  id: UnitIDType | UpgradeIDType;
  value: number;
}

/* old type codecs. probably delete these soon
export const Cost = IO.intersection([
  IO.type({
    unit: UnitID.codec,
    value: IO.number,
  }),
  IO.partial({
    factor: IO.number,
  }),
]);
export type Cost = IO.TypeOf<typeof Cost>;

export const Prod = IO.type({
  unit: UnitID.codec,
  value: IO.number,
});
export type Prod = IO.TypeOf<typeof Prod>;

export const Require = IO.type({
  id: IO.union([UnitID.codec, UpgradeID.codec]),
  value: IO.number,
});
export type Require = IO.TypeOf<typeof Require>;

export const Unit = IO.intersection([
  IO.type({
    id: UnitID.codec,
  }),
  IO.partial({
    cost: IO.array(Cost),
    prod: IO.array(Prod),
    require: IO.array(Require),
  }),
]);
export type Unit = IO.TypeOf<typeof Unit>;

export const Upgrade = IO.intersection([
  IO.type({
    id: UpgradeID.codec,
  }),
  IO.partial({
    cost: IO.array(Cost),
    require: IO.array(Require),
  }),
]);
export type Upgrade = IO.TypeOf<typeof Upgrade>;

export const Achievement = IO.type({
  id: AchievementID.codec,
  visible: IO.array(Require),
});
export type Achievement = IO.TypeOf<typeof Achievement>;
*/
