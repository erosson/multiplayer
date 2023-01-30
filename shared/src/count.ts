import * as Proto from "../dist/count.js";

export const input = {
  incr(): Proto.Input {
    return Proto.Input.create({
      input: { oneofKind: "incr", incr: Proto.Incr.create() },
    });
  },
  decr(): Proto.Input {
    return Proto.Input.create({
      input: { oneofKind: "decr", decr: Proto.Decr.create() },
    });
  },
  tick(): Proto.Input {
    return Proto.Input.create({
      input: { oneofKind: "tick", tick: Proto.Tick.create() },
    });
  },
};

export const action = {
  tick(): Proto.Action {
    return Proto.Action.create({
      action: { oneofKind: "tick", tick: Proto.Tick.create() },
    });
  },
  reset(state: Proto.State): Proto.Action {
    return Proto.Action.create({
      action: { oneofKind: "reset", reset: Proto.Reset.create({ state }) },
    });
  },
};

export function updateServer(
  state: Proto.State,
  { input }: Proto.Input
): Proto.State {
  switch (input.oneofKind) {
    case "decr":
      return { ...state, value: state.value - 1 };
    case "incr":
      return { ...state, value: state.value + 1 };
    case "tick":
      return { ...state, elapsed: input.tick.elapsed };
    default:
      return state;
  }
}

export function updateClient(
  state: Proto.State,
  { action }: Proto.Action
): Proto.State {
  switch (action.oneofKind) {
    case "reset":
      return action.reset.state ?? state;
    default:
      return updateServer(state, Proto.Input.create({ input: action }));
  }
}
