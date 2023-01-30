import * as Proto from "../dist/platform.js";

export const input = {
  control(control: Proto.ControlState): Proto.Input {
    return Proto.Input.create({
      input: {
        oneofKind: "control",
        control: Proto.Control.create({ control }),
      },
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
  if (!state.location) return state;
  if (!state.control) return state;
  switch (input.oneofKind) {
    case "control":
      return { ...state, control: input.control.control };
    case "tick":
      return {
        ...state,
        elapsed: input.tick.elapsed,
        location: locationTick(state.location, state.control),
      };
    default:
      return state;
  }
}
function locationTick(
  location: Proto.Point,
  control: Proto.ControlState
): Proto.Point {
  let { x, y } = location;
  x = x + (control.left ? -1 : 0) + (control.right ? 1 : 0);
  x = clampWrap(x, { min: -50, max: 50 });
  y = y + (control.down ? -1 : 0) + (control.up ? 1 : 0);
  y = clampWrap(y, { min: -50, max: 50 });
  return { x, y };
}
function clampWrap(value: number, bound: { min: number; max: number }): number {
  const { min, max } = bound;
  const size = max - min;
  if (value < min) value += size;
  if (value >= max) value -= size;
  return value;
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
