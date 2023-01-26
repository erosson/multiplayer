import * as IO from "io-ts";
import { Newtype } from "newtype-ts";
import { isoCodec } from "./util/schema";

// ID types are distinct from each other despite being strings underneath,
// so they get newtypes and TS enforces the difference.
// They're serialized in player saved data, so they get codecs too.
export interface UnitID
  extends Newtype<{ readonly UnitID: unique symbol }, string> {}
export const UnitID = isoCodec<UnitID>(IO.string);

export interface UpgradeID
  extends Newtype<{ readonly UpgradeID: unique symbol }, string> {}
export const UpgradeID = isoCodec<UpgradeID>(IO.string);

export interface AchievementID
  extends Newtype<{ readonly AchievementID: unique symbol }, string> {}
export const AchievementID = isoCodec<AchievementID>(IO.string);
