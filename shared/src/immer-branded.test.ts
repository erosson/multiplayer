import * as N from "newtype-ts";
import * as I from "immer";
I.enableAllPlugins();

test("hello immer", () => {
  const x0 = { a: 1, b: "two", c: new Map(), d: new Set() };
  const x1 = I.produce(x0, (x) => {
    x.a += 1;
    x["b"] += "two";
    x.c.set("test", 3);
    x.c.set("testtest", 3);
    x.d.add("e");
    x.d.add("f");
  });
  expect(x1).toEqual({
    a: 2,
    b: "twotwo",
    c: new Map([
      ["test", 3],
      ["testtest", 3],
    ]),
    d: new Set(["e", "f"]),
  });
});

describe("hello immer + branded types", () => {
  type ID1 = string & { readonly _: unique symbol };
  function ID1(s: string): ID1 {
    return s as ID1;
  }
  type ID2 = string & { readonly _: unique symbol };
  function ID2(s: string): ID2 {
    return s as ID2;
  }
  const x: ID1 = ID1("x");
  const y: ID2 = ID2("x");
  const s: string = "x";

  test("values", () => {
    // same runtime values
    expect(s).toEqual(x);
    expect(s).toEqual(y);
    expect(x).toEqual(y);
    // no upcasting from string to branded
    // @ts-expect-error
    const sx1: ID1 = s;
    // @ts-expect-error
    const sx2: ID1 = "x";
    // yes downcasting from branded to string. This is important for set/map/object indexing
    const xs1: string = x;
  });

  test("sets", () => {
    const xs1 = new Set<ID1>([x, ID1("a")]);
    const xs2 = new Set<ID1>();
    xs2.add(x);
    xs2.add(ID1("a"));
    expect(xs1).toEqual(xs2);
    // @ts-expect-error
    new Set<ID1>(y);
    // @ts-expect-error
    new Set<ID1>(s);
    // @ts-expect-error
    new Set<ID1>("x");

    const xs3 = I.produce(new Set<ID1>(), (s) => {
      s.add(x);
      s.add(ID1("a"));
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
      [ID1("a"), 1],
    ]);
    const xs2 = new Map<ID1, number>();
    xs2.set(x, 1);
    xs2.set(ID1("a"), 1);
    expect(xs1).toEqual(xs2);
    // @ts-expect-error
    new Map<ID1, number>([[y, 1]]);
    // @ts-expect-error
    new Map<ID1, number>([[s, 1]]);
    // @ts-expect-error
    new Map<ID1, number>([["x", 1]]);

    const xs3 = I.produce(new Map<ID1, number>(), (s) => {
      s.set(x, 1);
      s.set(ID1("a"), 1);
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

  test("records", () => {
    const xs1: Record<ID1, number> = {
      [x]: 1,
      [ID1("a")]: 1,
    };
    const xs2: Record<ID1, number> = {};
    xs2[x] = 1;
    xs2[ID1("a")] = 1;
    expect(xs1).toEqual(xs2);
    // oops, it doesn't enforce these. I would've expected it to do so!
    // still, with immutable Maps from immer, we don't really need objects as maps.
    const xe1: Record<ID1, number> = { [y]: 1 };
    const xe2 = { [y]: 1 } as Record<ID1, number>;
    xe1[y] = 3;

    const xs3 = I.produce({} as Record<ID1, number>, (s) => {
      s[x] = 1;
      s[ID1("a")] = 1;
    });
    expect(xs1).toEqual(xs3);

    const xs4 = I.produce(xs3, (s) => {
      s[x] = 2;
      delete s[x];
      s[x] = 3;
      s[x] = 1;
      s[x] = 1;
    });
    expect(xs3).toEqual(xs4);
    // it's not *this* smart
    expect(xs3).not.toBe(xs4);
  });
});
