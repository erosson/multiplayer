import * as IO from "io-ts";
import { Newtype, getOrd } from "newtype-ts";
import { isoCodec } from "./util/schema";
import { Ord as StringOrd } from "fp-ts/string";

// id types

export interface UnitID
  extends Newtype<{ readonly _: unique symbol }, string> {}
export const UnitID = {
  ...isoCodec<UnitID>(IO.string),
  ord: getOrd<UnitID>(StringOrd),
};

export interface UpgradeID
  extends Newtype<{ readonly _: unique symbol }, string> {}
export const UpgradeID = {
  ...isoCodec<UpgradeID>(IO.string),
  ord: getOrd<UpgradeID>(StringOrd),
};

export interface AchievementID
  extends Newtype<{ readonly _: unique symbol }, string> {}
export const AchievementID = {
  ...isoCodec<AchievementID>(IO.string),
  ord: getOrd<AchievementID>(StringOrd),
};

// game schema

export const Cost = IO.intersection([
  IO.type({
    unit: UnitID.codec,
    value: IO.number,
  }),
  IO.partial({ factor: IO.number }),
]);
export type Cost = IO.TypeOf<typeof Cost>;

export const Prod = IO.type({
  unit: UnitID.codec,
  value: IO.number,
});
export type Prod = IO.TypeOf<typeof Prod>;

const UnitIDType = IO.type({
  type: IO.literal("unit"),
  unit: UnitID.codec,
});
type UnitIDType = IO.TypeOf<typeof UnitIDType>;

const UpgradeIDType = IO.type({
  type: IO.literal("upgrade"),
  unit: UpgradeID.codec,
});
type UpgradeIDType = IO.TypeOf<typeof UpgradeIDType>;

export const Require = IO.type({
  id: IO.union([UnitIDType, UpgradeIDType]),
  value: IO.number,
});
export type Require = IO.TypeOf<typeof Require>;

export const Unit = IO.intersection(
  [
    IO.type({
      id: UnitID.codec,
      cost: IO.array(Cost),
      prod: IO.array(Prod),
    }),
    IO.partial({
      init: IO.number,
      require: IO.array(Require),
    }),
  ],
  "Unit"
);
export type Unit = IO.TypeOf<typeof Unit>;

export const Upgrade = IO.intersection(
  [
    IO.type({
      id: UpgradeID.codec,
    }),
    IO.partial({
      cost: IO.array(Cost),
      require: IO.array(Require),
    }),
  ],
  "Upgrade"
);
export type Upgrade = IO.TypeOf<typeof Upgrade>;

export const Achievement = IO.type(
  {
    id: AchievementID.codec,
    visible: IO.array(Require),
  },
  "Achievement"
);
export type Achievement = IO.TypeOf<typeof Achievement>;
