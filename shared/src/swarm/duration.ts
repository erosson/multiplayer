/**
 * An amount of time, like "three hours and six minutes" or "47 milliseconds".
 *
 * Usage: `import * as Duration from "./duration.js"`
 */
import * as IO from "io-ts";
import * as IOT from "io-ts-types";
import * as N from "newtype-ts";

interface DurationMillis
  extends N.Newtype<{ readonly DurationMillis: unique symbol }, number> {}
/**
 * Opaque type representing an amount of time, like "three hours and six minutes" or "47 milliseconds".
 */
export type T = DurationMillis;
const iso = N.iso<DurationMillis>();
export const codec = IOT.fromNewtype<DurationMillis>(IO.number);

export function fromMillis(ms: number): DurationMillis {
  return iso.wrap(ms);
}
export function fromSeconds(s: number): DurationMillis {
  return fromMillis(s * 1000);
}
/**
 * Find the duration between the two given dates
 */
export function between(d: { before: Date; after: Date }): DurationMillis {
  return fromMillis(d.after.getTime() - d.before.getTime());
}
/**
 * Find the duration between now and a provided start date
 */
export function now(relativeTo: Date): DurationMillis {
  const now = new Date();
  return between({ before: relativeTo, after: now });
}

export const zero = fromMillis(0);

export function toMillis(a: DurationMillis): number {
  return iso.unwrap(a);
}
export function toSeconds(a: DurationMillis): number {
  return toMillis(a) / 1000;
}

export function add(a: DurationMillis, b: DurationMillis): DurationMillis {
  return iso.wrap(iso.unwrap(a) + iso.unwrap(b));
}
export function sub(a: DurationMillis, b: DurationMillis): DurationMillis {
  return iso.wrap(iso.unwrap(a) - iso.unwrap(b));
}
export function neg(a: DurationMillis): DurationMillis {
  return iso.wrap(-iso.unwrap(a));
}

/**
 * Add a duration to a date. ex: "3 hours after today at 11am"
 */
export function dateAdd(date: Date, elapsed: DurationMillis): Date {
  return new Date(date.getTime() + toMillis(elapsed));
}
/**
 * Subtract a duration from a date. ex: "3 hours before today at 11am"
 */
export function dateSub(date: Date, elapsed: DurationMillis): Date {
  return new Date(date.getTime() - toMillis(elapsed));
}
