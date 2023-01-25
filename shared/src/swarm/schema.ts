import * as IO from "io-ts";
import * as IOT from "io-ts-types";
import { Iso } from "monocle-ts";
import { Newtype, iso, CarrierOf } from "newtype-ts";

interface IsoCodec<A extends Newtype<any, any>> {
  iso: Iso<A, CarrierOf<A>>;
  codec: IO.Type<A, CarrierOf<A>, IO.OutputOf<CarrierOf<A>>>;
}
function isoCodec<A extends Newtype<any, any>>(
  wrappedCodec: IO.Type<any, any, any>
): IsoCodec<A> {
  return {
    iso: iso<A>(),
    codec: IOT.fromNewtype<A>(wrappedCodec),
  };
}

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

// IDs need codecs, but non-IDs don't. We're hardcoding game data, not decoding
// from a spreadsheet or file. No real value in a spreadsheet, and simpler types
export interface Unit {
  id: UnitID;
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

export interface Require {
  unit: UnitID | UpgradeID;
  value: number;
}
