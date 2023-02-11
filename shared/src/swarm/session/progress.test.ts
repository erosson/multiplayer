import produce from "immer";
import * as P from "./progress";
test("progress ticks", () => {
  const p = { id: "", state: P.StateID.test, value: 0 };
  const r = { value: p, complete: new Map() };
  expect(P.tick(p, 0)).toEqual(r);
  expect(P.tick(p, 1)).toEqual(
    produce(r, (r) => {
      r.value.value = 10;
    })
  );
  expect(P.tick(p, 9)).toEqual(
    produce(r, (r) => {
      r.value.value = 90;
    })
  );
  expect(P.tick(p, 10)).toEqual(
    produce(r, (r) => {
      r.value.state = P.StateID.test2;
      r.value.value = 0;
      r.complete.set(P.StateID.test, 1);
    })
  );
  expect(P.tick(p, 11)).toEqual(
    produce(r, (r) => {
      r.value.state = P.StateID.test2;
      r.value.value = 20;
      r.complete.set(P.StateID.test, 1);
    })
  );
  expect(P.timeUntilCycleComplete(P.getState(p.state))).toBe(16);
  expect(P.tick(p, 16)).toEqual(
    produce(r, (r) => {
      r.complete.set(P.StateID.test, 1);
      r.complete.set(P.StateID.test2, 1);
    })
  );
  expect(P.tick(p, 32)).toEqual(
    produce(r, (r) => {
      r.complete.set(P.StateID.test, 2);
      r.complete.set(P.StateID.test2, 2);
    })
  );
  expect(P.tick(p, 41)).toEqual(
    produce(r, (r) => {
      r.value.state = P.StateID.test;
      r.value.value = 90;
      r.complete.set(P.StateID.test, 2);
      r.complete.set(P.StateID.test2, 2);
    })
  );
  expect(P.tick(p, 42)).toEqual(
    produce(r, (r) => {
      r.value.state = P.StateID.test2;
      r.value.value = 0;
      r.complete.set(P.StateID.test, 3);
      r.complete.set(P.StateID.test2, 2);
    })
  );
});
