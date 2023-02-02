import React from "react";
import * as S from "shared/src/swarm";
import { ViewPolynomial, inputInt, inputFloat } from "./swarm";

const style = {
  input: { width: "5em" },
  readonlyInput: { width: "5em", border: "none" },
  prodList: { padding: 0, margin: 0, listStyleType: "none" },
};
export default function Swarm(): JSX.Element {
  const data = S.Data.create();
  console.log("data", data);
  return <_Swarm data={data} />;
}
function _Swarm(props: {
  data: ReturnType<typeof S.Data.create>;
}): JSX.Element {
  const { data } = props;
  const [session, setSession] = React.useState(() => S.Session.create(data));
  const [timeMs, setTimeMs] = React.useState(0);

  function elapsed() {
    return S.Session.elapsedMs(timeMs);
  }
  function reify() {
    setSession((session) => S.Session.reify(session, elapsed()));
  }

  return (
    <div>
      <h1>swarm</h1>
      <table>
        <thead>
          <Timer timeMs={timeMs} setTimeMs={setTimeMs} reify={reify} />
          <tr>
            <th>Name</th>
            <th>Count(0)</th>
            <th>Produces</th>
            <th>Prod Rate</th>
            <th>Count(t)</th>
            <th>Polynomial</th>
            <th>Degree</th>
            <th>Cost</th>
            <th>Buyable</th>
            <th>Buy Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.unit.list.map((unit, i) => {
            return (
              <Unit
                key={unit.id}
                unit={unit}
                elapsed={elapsed}
                session={session}
                setSession={setSession}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Unit<I extends S.Schema.AnyID>(props: {
  unit: S.Schema.Unit<I>;
  session: S.Session.Session<I>;
  setSession: React.Dispatch<React.SetStateAction<S.Session.Session<I>>>;
  elapsed: () => S.Session.ElapsedMs;
}): JSX.Element {
  // TODO this is huge, break down more
  const { unit, session, setSession, elapsed } = props;
  const count0 = S.Session.unitCount0(session, unit.id);
  const count = S.Session.unitCount(session, unit.id, elapsed());
  const poly = S.Session.unitPolynomial(session, unit.id);

  return (
    <tr key={unit.id}>
      <th>{unit.id}</th>
      <td>
        <input
          type="number"
          style={style.input}
          value={count0}
          onInput={(e) => {
            const value = e.currentTarget.value;
            setSession((session) =>
              S.Session.setUnit(session, unit.id, (u) => ({
                ...u,
                count: inputInt(value ?? "", count0),
              }))
            );
          }}
        />
      </td>
      <td>
        <ul style={style.prodList}>
          {(unit.prod ?? []).map((prod) => (
            <li key={`${unit.id} -> ${prod.unit}`}>
              {prod.unit} &times;{prod.value}
            </li>
          ))}
        </ul>
      </td>
      <td>
        {S.Session.unitVelocity(session, unit.id, elapsed()).toPrecision(3)}
        /s
      </td>
      <td>
        <input
          readOnly={true}
          type="number"
          style={style.readonlyInput}
          value={count.toPrecision(3)}
        />
      </td>
      <td>
        <ViewPolynomial poly={poly} />
      </td>
      <td>{S.Polynomial.degree(poly)}</td>
      <td>
        <ul style={style.prodList}>
          {(unit.cost ?? []).map((cost) => (
            <li key={`${unit.id} $$ ${cost.unit}`}>
              {cost.unit} &times;
              {cost.value * (cost.factor ? Math.pow(cost.factor, count0) : 1)}
            </li>
          ))}
        </ul>
      </td>
      <td>
        <ul style={style.prodList}>
          {(unit.cost ?? []).map((cost) => (
            <li key={`${unit.id} $$$ ${cost.unit}`}>
              {S.Session.costBuyable(session, cost, elapsed()).toPrecision(3)}{" "}
              buyable
            </li>
          ))}
        </ul>
      </td>
      <td>
        <ul style={style.prodList}>
          {(unit.cost ?? []).map((cost) => (
            <li key={`${unit.id} $$$ ${cost.unit}`}>
              {S.Session.costBuyableVelocity(
                session,
                cost,
                elapsed()
              ).toPrecision(3)}
              /s
            </li>
          ))}
        </ul>
      </td>
    </tr>
  );
}

function Timer(props: {
  timeMs: number;
  setTimeMs: React.Dispatch<React.SetStateAction<number>>;
  reify: () => void;
}): JSX.Element {
  const [start, setStart] = React.useState(Date.now());
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    let handle: number | null = null;
    function tick() {
      if (!paused) {
        const now = Date.now();
        props.setTimeMs(now - start);
      }
      handle = requestAnimationFrame(tick);
    }
    tick();
    return () => {
      if (handle !== null) cancelAnimationFrame(handle);
    };
  }, [paused, start, props.setTimeMs]);

  function reify() {
    props.setTimeMs(0);
    setStart(Date.now());
    props.reify();
  }

  return (
    <tr>
      <th>Time</th>
      <td>
        <input
          type="number"
          style={style.input}
          value={props.timeMs / 1000}
          onInput={(e) => {
            setPaused(true);
            props.setTimeMs(
              Math.floor(1000 * inputFloat(e.currentTarget.value, props.timeMs))
            );
          }}
        />
      </td>
      <td>
        <button
          onClick={() => {
            setStart(Date.now() - props.timeMs);
            setPaused(!paused);
          }}
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </td>
      <td>
        <button onClick={reify}>Reify</button>
      </td>
    </tr>
  );
}
