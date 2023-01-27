import * as IO from "io-ts";
import * as IOT from "io-ts-types";
import { Iso } from "monocle-ts";
import { Newtype, iso, CarrierOf } from "newtype-ts";

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
  const accum = {} as Record<K, A[]>;
  for (let tag of tags) {
    accum[tag] = [];
  }
  for (let entry of list) {
    const k = key(entry);
    accum[k].push(entry);
  }
  return accum;
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
