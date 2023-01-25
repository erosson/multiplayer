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

export interface UnitID
  extends Newtype<{ readonly UnitID: unique symbol }, string> {}
export const UnitID = isoCodec<UnitID>(IO.string);

export interface UpgradeID
  extends Newtype<{ readonly UpgradeID: unique symbol }, string> {}
export const UpgradeID = isoCodec<UpgradeID>(IO.string);

export interface AchievementID
  extends Newtype<{ readonly AchievementID: unique symbol }, string> {}
export const AchievementID = isoCodec<AchievementID>(IO.string);

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
