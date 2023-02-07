import * as N from "newtype-ts";
import * as I from "immer";
I.enableAllPlugins();

test("hello newtype", () => {
  type ID3 = N.Newtype<{ readonly _: unique symbol }, string>;
  const ID3 = N.iso<ID3>();
  const x = ID3.wrap("x");
  // newtype construction is stricter than branded types here! that's kind of nice.
  // @ts-expect-error
  "x" as ID3;
  // unwrapping is stricter too
  // @ts-expect-error
  x as string;
  const s: string = ID3.unwrap(x);

  // and it still works with sets and maps?! I thought this is where it failed before...
  const xset = new Set<ID3>();
  xset.add(x);
  const xmap = new Map<ID3, number>();
  xmap.set(x, 1);
  // no, records are where it broke before, now I remember.
  // but we saw above with branded types that record typing is screwy anyway -
  // and with immutable maps from `immer`, we don't really need this anyway.
  // not to mention, failing like this instead of being overly permissive is probably better
  // @ts-expect-error
  const xrec: { [k: ID3]: number } = {};
});

describe("hello immer + newtype", () => {
  type ID1 = N.Newtype<{ readonly _: unique symbol }, string>;
  const ID1 = N.iso<ID1>();
  type ID2 = N.Newtype<{ readonly _: unique symbol }, string>;
  const ID2 = N.iso<ID2>();
  const x: ID1 = ID1.wrap("x");
  const y: ID2 = ID2.wrap("x");
  const s: string = "x";

  test("values", () => {
    // same runtime values
    expect(s).toEqual(x);
    expect(s).toEqual(y);
    expect(x).toEqual(y);
    // no upcasting from string to newtype
    // @ts-expect-error
    const sx1: ID1 = s;
    // @ts-expect-error
    const sx2: ID1 = "x";
    // no downcasting from newtype to string! big difference from branded types
    // @ts-expect-error
    const xs1: string = x;
    const xs2: string = ID1.unwrap(x);
  });

  test("sets", () => {
    const xs1 = new Set<ID1>([x, ID1.wrap("a")]);
    const xs2 = new Set<ID1>();
    xs2.add(x);
    xs2.add(ID1.wrap("a"));
    expect(xs1).toEqual(xs2);
    // @ts-expect-error
    new Set<ID1>(y);
    // @ts-expect-error
    new Set<ID1>(s);
    // @ts-expect-error
    new Set<ID1>("x");

    const xs3 = I.produce(new Set<ID1>(), (s) => {
      s.add(x);
      s.add(ID1.wrap("a"));
    });
    expect(xs1).toEqual(xs3);

    const xs4 = I.produce(xs3, (s) => {
      s.add(x);
      s.delete(x);
      s.add(x);
      s.add(x);
    });
    expect(xs3).toEqual(xs4);
    // it's not *this* smart
    expect(xs3).not.toBe(xs4);
  });

  test("maps", () => {
    const xs1 = new Map<ID1, number>([
      [x, 1],
      [ID1.wrap("a"), 1],
    ]);
    const xs2 = new Map<ID1, number>();
    xs2.set(x, 1);
    xs2.set(ID1.wrap("a"), 1);
    expect(xs1).toEqual(xs2);
    // @ts-expect-error
    new Map<ID1, number>([[y, 1]]);
    // @ts-expect-error
    new Map<ID1, number>([[s, 1]]);
    // @ts-expect-error
    new Map<ID1, number>([["x", 1]]);

    const xs3 = I.produce(new Map<ID1, number>(), (s) => {
      s.set(x, 1);
      s.set(ID1.wrap("a"), 1);
    });
    expect(xs1).toEqual(xs3);

    const xs4 = I.produce(xs3, (s) => {
      s.set(x, 2);
      s.delete(x);
      s.set(x, 3);
      s.set(x, 1);
      s.set(x, 1);
    });
    expect(xs3).toEqual(xs4);
    // it's not *this* smart
    expect(xs3).not.toBe(xs4);
  });

  test("records (not allowed)", () => {
    // newtype record indexes are simply not allowed at all. Important difference from branded types!
    // But with immutable newtype-keyed maps, so we don't really need these, right?
    // @ts-expect-error
    const xs1: Record<ID1, number> = {};
    // @ts-expect-error
    const xs2: { [k: ID1]: number } = {};
  });
});
