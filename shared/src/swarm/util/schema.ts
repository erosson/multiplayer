import * as IO from "io-ts";
import * as IOT from "io-ts-types";
import { Iso } from "monocle-ts";
import { Newtype, iso, CarrierOf } from "newtype-ts";
import * as MapU from "./map";
import * as I from "immer";
I.enableAllPlugins();

export interface IsoCodec<A extends Newtype<any, any>> {
  iso: Iso<A, CarrierOf<A>>;
  codec: IO.Type<A, CarrierOf<A>, IO.OutputOf<CarrierOf<A>>>;
}
export function isoCodec<A extends Newtype<any, any>>(
  wrappedCodec: IO.Type<any, any, any>
): IsoCodec<A> {
  return {
    iso: iso<A>(),
    codec: IOT.fromNewtype<A>(wrappedCodec),
  };
}

/**
 * Create an object referencing newtyped-IDs by name.
 *
 * Usage:
 *
 *     import {Newtype, iso} from 'newtype-ts'
 *
 *     // create a newtype with a wrapper
 *     interface UnitID extends Newtype<{readonly _: unique symbol}, string>
 *     const UnitID = iso<UnitID>()
 *
 *     // create an object wrapping those types by name
 *     const Unit = idRecord(['larva', 'hatchery', 'drone'] as const, UnitID.wrap)
 *
 *     // existing names can be safely referenced
 *     const id: UnitID = Unit.larva
 *     // non-existing names are type errors (don't forget the `as const` above!)
 *     // @ts-expect-error
 *     const error: UnitID = Unit.doesntExist
 */
export function idRecord<I extends string | number | symbol, O>(
  ids: readonly I[],
  wrap: (i: I) => O
): Record<I, O> {
  const ret = {} as Record<I, O>;
  for (let id of ids) {
    ret[id] = wrap(id);
  }
  return ret;
}

export function keyBy<A, K extends string | number | symbol>(
  list: readonly A[],
  key: (a: A) => K
): Record<K, A> {
  const accum = {} as Record<K, A>;
  for (let entry of list) {
    const k = key(entry);
    if (k in accum)
      throw new Error(`keyBy: duplicate key ${JSON.stringify(String(k))}`);
    accum[k] = entry;
  }
  return accum;
}

export function tagBy<K extends string | number | symbol, A>(
  tags: readonly K[],
  list: readonly A[],
  key: (a: A) => K[]
): Record<K, A[]> {
  const accum = {} as Record<K, A[]>;
  for (let tag of tags) {
    accum[tag] = [];
  }
  for (let entry of list) {
    for (let k of key(entry)) {
      accum[k].push(entry);
    }
  }
  return accum;
}

export function groupBy<K extends string | number | symbol, A>(
  tags: readonly K[],
  list: readonly A[],
  key: (a: A) => K
): Record<K, A[]> {
  return tagBy(tags, list, (a: A) => [key(a)]);
}

export function mapKeyBy<K, V>(
  list: readonly V[],
  key: (v: V) => K
): Map<K, V> {
  return new Map(list.map((v) => [key(v), v]));
}

export function mapGroupBy<K, V>(
  list: readonly V[],
  key: (v: V) => K
): Map<K, V[]> {
  return mapTagBy(list, (v: V) => [key(v)]);
}

export function mapTagBy<K, V>(
  list: readonly V[],
  key: (v: V) => K[]
): Map<K, V[]> {
  return I.produce(new Map<K, V[]>(), (accum) => {
    for (let val of list) {
      for (let tag of key(val)) {
        MapU.setdefault(accum, I.castDraft(tag), []).push(I.castDraft(val));
      }
    }
  });
}
