import { Newtype, iso } from "newtype-ts";

export interface UnitID
  extends Newtype<{ readonly _: unique symbol }, string> {}
export const UnitID = iso<UnitID>();

export interface UpgradeID
  extends Newtype<{ readonly _: unique symbol }, string> {}
export const UpgradeID = iso<UpgradeID>();

export interface AchievementID
  extends Newtype<{ readonly _: unique symbol }, string> {}
export const AchievementID = iso<AchievementID>();

export interface Unit {
  id: UnitID;
  init?: number;
  cost?: Cost[];
  prod?: Prod[];
  require?: Require[];
}

export interface Upgrade {
  id: UpgradeID;
  cost?: Cost[];
  require?: Require[];
}

export interface Achievement {
  id: AchievementID;
  visible: Require[];
}

export interface Cost {
  unit: UnitID;
  value: number;
  factor?: number;
}

export interface Prod {
  unit: UnitID;
  value: number;
}

interface UnitIDType {
  type: "unit";
  unit: UnitID;
}
interface UpgradeIDType {
  type: "upgrade";
  upgrade: UpgradeID;
}

export interface Require {
  id: UnitIDType | UpgradeIDType;
  value: number;
}
