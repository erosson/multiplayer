import * as IO from "io-ts";
import * as IOT from "io-ts-types";
import * as N from "newtype-ts";

interface DurationMillis
  extends N.Newtype<{ readonly DurationMillis: unique symbol }, number> {}
export type T = DurationMillis;
const iso = N.iso<DurationMillis>();
export const codec = IOT.fromNewtype<DurationMillis>(IO.number);

export function fromMillis(ms: number): DurationMillis {
  return iso.wrap(ms);
}
export function fromSeconds(s: number): DurationMillis {
  return fromMillis(s * 1000);
}
export function between(d: { before: Date; after: Date }): DurationMillis {
  return iso.wrap(d.after.getTime() - d.before.getTime());
}
export const zero = fromMillis(0);

export function toMillis(a: DurationMillis): number {
  return iso.unwrap(a);
}
export function toSeconds(a: DurationMillis): number {
  return iso.unwrap(a) / 1000;
}
export function since(date: Date, elapsed: T): Date {
  return new Date(date.getTime() + iso.unwrap(elapsed));
}

export function add(a: DurationMillis, b: DurationMillis): DurationMillis {
  return iso.wrap(iso.unwrap(a) + iso.unwrap(b));
}
export function sub(a: DurationMillis, b: DurationMillis): DurationMillis {
  return iso.wrap(iso.unwrap(a) - iso.unwrap(b));
}
