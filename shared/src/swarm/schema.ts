// IDs need codecs, but non-IDs don't. We're hardcoding game data, not decoding
// from a spreadsheet or file. No real value in a spreadsheet, and simpler types
export interface ID<UnitID, UpgradeID, AchievementID> {
  Unit: UnitID;
  Upgrade: UpgradeID;
  Achievement: AchievementID;
}
export interface AnyID extends ID<any, any, any> {}
export type UnitID<C extends AnyID> = C["Unit"][keyof C["Unit"]];
export type UpgradeID<C extends AnyID> = C["Upgrade"][keyof C["Upgrade"]];
export type AchievementID<C extends AnyID> =
  C["Achievement"][keyof C["Achievement"]];

export interface Unit<ID extends AnyID> {
  id: UnitID<ID>;
  init?: number;
  cost?: Cost<ID>[];
  prod?: Prod<ID>[];
  require?: Require<ID>[];
}

export interface Upgrade<ID extends AnyID> {
  id: UpgradeID<ID>;
  cost?: Cost<ID>[];
  require?: Require<ID>[];
}

export interface Achievement<ID extends AnyID> {
  id: AchievementID<ID>;
  visible: Require<ID>[];
}

export interface Cost<ID extends AnyID> {
  unit: UnitID<ID>;
  value: number;
  factor?: number;
}

export interface Prod<ID extends AnyID> {
  unit: UnitID<ID>;
  value: number;
}

interface UnitIDType<ID extends AnyID> {
  type: "unit";
  unit: UnitID<ID>;
}
interface UpgradeIDType<ID extends AnyID> {
  type: "upgrade";
  upgrade: UpgradeID<ID>;
}

export interface Require<ID extends AnyID> {
  id: UnitIDType<ID> | UpgradeIDType<ID>;
  value: number;
}
