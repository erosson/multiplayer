import { Ord as StringOrd } from "fp-ts/string";
import * as IO from "io-ts";
import * as IOT from "io-ts-types";
import { getOrd, Newtype } from "newtype-ts";
import * as Proto from "../../../dist/swarm/session/session";
import { sum } from "../util/math";
import { idRecord, isoCodec, mapKeyBy, protoCodec } from "../util/schema";

export interface State {
  id: StateID;
  next: StateID;
  velocity: number;
  maximum: number;
}
export interface StateID
  extends Newtype<{ readonly _: unique symbol }, string> {}
export const StateIDT = {
  ...isoCodec<StateID>(IO.string),
  ord: getOrd<StateID>(StringOrd),
};
export const StateID = idRecord(["test", "test2"] as const, StateIDT.wrap);
export const State = mapKeyBy(
  [
    { id: StateID.test, next: StateID.test2, velocity: 10, maximum: 100 },
    { id: StateID.test2, next: StateID.test, velocity: 20, maximum: 120 },
  ],
  (s) => s.id
);

export const Progress = protoCodec(
  IO.type({
    id: IO.string,
    stateId: StateIDT.codec,
    value: IO.number,
  }),
  Proto.Progress
);
export interface Progress extends IO.TypeOf<typeof Progress.codec> {}

export const ProgressComplete = protoCodec(
  IO.type({
    stateId: StateIDT.codec,
    count: IO.number,
  }),
  Proto.ProgressComplete
);
export interface ProgressComplete
  extends IO.TypeOf<typeof ProgressComplete.codec> {}

export const ProgressCompleteEntry: IO.Type<
  [StateID, number],
  Proto.ProgressComplete
> = ProgressComplete.codec.pipe(
  new IO.Type(
    "ProgressCompleteEntry",
    IO.tuple([StateIDT.codec, IO.number]).is,
    (enc, c) =>
      ProgressComplete.codec.is(enc)
        ? IO.success([enc.stateId, enc.count])
        : IO.failure(`not a ProgressCompleteEntry: ${enc}`, c),
    (dec) => ({ stateId: dec[0], count: dec[1] })
  )
);
function identityCodec<T>(name?: string): IO.Type<T, T> {
  return new IO.Type<T, T>(
    name ?? "identity",
    IO.any.is,
    (enc: unknown) => IO.success(enc as any),
    (dec: T) => dec
  );
}
export interface ProgressCompleteEntry
  extends IO.TypeOf<typeof ProgressCompleteEntry> {}

export const ProgressCompleteMap = IO.array(ProgressCompleteEntry).pipe(
  // IOT.mapFromEntries(IO.string, StringOrd, IO.number)
  // IOT.mapFromEntries(StateIDT.codec, getOrd(StringOrd), IO.number)
  IOT.mapFromEntries(identityCodec<StateID>(), getOrd(StringOrd), IO.number)
);

export interface Result {
  value: Progress;
  complete: Map<StateID, number>;
}
export interface Results {
  values: Progress[];
  complete: Map<StateID, number>;
}
export function getState(id: StateID): State {
  const st = State.get(id);
  if (!st) throw new Error(`unknown progress-state ${id}`);
  return st;
}
function nextProgress(p: Progress): Progress {
  return { id: p.id, value: 0, stateId: getState(p.stateId).next };
}
export function timeUntilProgressComplete(p: Progress): number {
  const st = getState(p.stateId);
  return Math.max((st.maximum - p.value) / st.velocity, 0);
}
export function timeUntilStateComplete(st: State): number {
  return st.maximum / st.velocity;
}
function stateCycle(st: State): StateID[] {
  const visited = new Set([st.id]);
  const list = [st.id];
  while (!visited.has(st.next)) {
    st = getState(st.next);
    visited.add(st.id);
    list.push(st.id);
  }
  return list;
}
// progress cycles are deterministic, taking a consistent amount of time to fill
export function timeUntilCycleComplete(st: State): number {
  return sum(stateCycle(st).map((id) => timeUntilStateComplete(getState(id))));
}
export function tick(p: Progress, t: number): Result {
  const complete = new Map<StateID, number>();
  p = { ...p };
  // Complete full progress cycles. cycles (and states) take a consistent amount of time to fill,
  // and this doesn't care how full the current progressbar is, so this is cheap!
  {
    const st = getState(p.stateId);
    const cycleT = timeUntilCycleComplete(st);
    const cycles = Math.floor(t / cycleT);
    if (cycles > 0) {
      t -= cycles * cycleT;
      for (let id of stateCycle(st)) {
        complete.set(id, (complete.get(id) ?? 0) + cycles);
      }
    }
    // Remaining time is guaranteed less than one complete cycle.
    if (t > cycleT) throw new Error(`time left should be < 1 complete cycle`);
  }
  // Complete full progress states, then try the next one in the cycle.
  // The first one is special: it may be partially complete already
  let dt = timeUntilProgressComplete(p);
  while (dt <= t) {
    t -= dt;
    complete.set(p.stateId, (complete.get(p.stateId) ?? 0) + 1);
    p = nextProgress(p);
    dt = timeUntilStateComplete(getState(p.stateId));
  }
  // Remaining time is guaranteed less than the next/last state.
  // Partially fill what's left.
  const st = getState(p.stateId);
  p.value += t * st.velocity;
  if (p.value >= st.maximum) {
    throw new Error(`progress bar max exceeded`);
  }
  return { complete, value: p };
}

export function ticks(ps: Progress[], t: number): Results {
  const rs = ps.map((p) => tick(p, t));
  const values = rs.map((r) => r.value);
  const complete = sumComplete(rs.map((r) => r.complete));
  return { values, complete };
}
export function tickResults(rs0: Results, t: number): Results {
  const rs = ticks(rs0.values, t);
  const complete = sumComplete([rs.complete, rs0.complete]);
  return { ...rs, complete };
}
export function sumComplete(
  completes: Map<StateID, number>[],
  r?: Map<StateID, number>
): Map<StateID, number> {
  r = r ?? new Map<StateID, number>();
  for (let c of completes) {
    for (let [k, v] of c.entries()) {
      r.set(k, (r.get(k) ?? 0) + v);
    }
  }
  return r;
}
