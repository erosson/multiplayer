import { JsonValue, MessageType } from "@protobuf-ts/runtime";
import * as I from "immer";
import * as IO from "io-ts";
import * as IOT from "io-ts-types";
import { iso, Newtype } from "newtype-ts";
import * as MapU from "./map";
I.enableAllPlugins();

export interface IsoCodec<A extends Newtype<unknown, unknown>> {
  codec: ReturnType<typeof IOT.fromNewtype<A>>;
  iso: ReturnType<typeof iso<A>>;
  // alias the most common iso methods for easy iso -> isocodec refactoring
  wrap: ReturnType<typeof iso<A>>["wrap"];
  unwrap: ReturnType<typeof iso<A>>["unwrap"];
}
export function isoCodec<A extends Newtype<unknown, unknown>>(
  wrappedCodec: Parameters<typeof IOT.fromNewtype<A>>[0]
): IsoCodec<A> {
  const iso_ = iso<A>();
  return {
    codec: IOT.fromNewtype<A>(wrappedCodec),
    iso: iso_,
    wrap(a) {
      return iso_.wrap(a);
    },
    unwrap(a) {
      return iso_.unwrap(a);
    },
  };
}

export interface ProtoCodec<IO, P extends object> {
  codec: IO.Type<IO, P>;
  proto: MessageType<P>;
  jsonString: IO.Type<IO, string>;
  jsonStringF: IO.Type<IO, string>;
  json: IO.Type<IO, JsonValue>;
  binary: IO.Type<IO, Uint8Array>;
}
export function protoCodec<I, P extends object>(
  codec: IO.Type<I, P>,
  proto: MessageType<P>
): ProtoCodec<I, P> {
  const jsonString: IO.Type<I, string> = protoCodecFn(
    IO.string.is,
    proto,
    (s) => proto.fromJsonString(s),
    (o) => proto.toJsonString(o),
    "jsonString"
  ).pipe(codec);

  const jsonStringF: IO.Type<I, string> = protoCodecFn(
    IO.string.is,
    proto,
    (s) => proto.fromJsonString(s),
    (o) => proto.toJsonString(o, { prettySpaces: 2 }),
    "jsonStringF"
  ).pipe(codec);

  const json: IO.Type<I, JsonValue> = protoCodecFn(
    IO.any.is,
    proto,
    (s) => proto.fromJson(s),
    (o) => proto.toJson(o),
    "json"
  ).pipe(codec);

  const binary: IO.Type<I, Uint8Array> = protoCodecFn(
    (v): v is Uint8Array => v instanceof Uint8Array,
    proto,
    (s) => proto.fromBinary(s),
    (o) => proto.toBinary(o),
    "binary"
  ).pipe(codec);
  return {
    codec,
    proto,
    jsonString,
    jsonStringF,
    json,
    binary,
  };
}

function ioTryCatch<A>(fn: () => A, ctx: IO.Context): IO.Validation<A> {
  try {
    return IO.success(fn());
  } catch (err) {
    return IO.failure(err, ctx);
  }
}
function protoCodecFn<A extends object, O>(
  is: IO.Is<O>,
  proto: MessageType<A>,
  from: (o: O) => A,
  to: (p: A) => O,
  name: string
): IO.Type<A, O> {
  return new IO.Type(
    `Proto.${proto.typeName}:${name}`,
    (val): val is A => proto.is(val),
    (s, ctx) =>
      is(s)
        ? ioTryCatch(() => from(s), ctx)
        : IO.failure(`${proto.typeName}: expected input type ${name}`, ctx),
    (p) => to(p)
  );
}

export function mapFromValues<K, V>(
  toKey: (v: V) => K,
  name: string = "mapFromValues"
): IO.Type<Map<K, V>, V[]> {
  return new IO.Type(
    name,
    (val): val is Map<K, V> => val instanceof Map,
    (array, ctx) =>
      Array.isArray(array)
        ? IO.success(new Map((array as V[]).map((v) => [toKey(v), v])))
        : IO.failure(array, ctx),
    (map) => Array.from(map.values())
  );
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
