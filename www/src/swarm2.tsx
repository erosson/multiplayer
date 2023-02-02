import React from "react";
import * as S from "shared/src/swarm";
import { keyBy } from "shared/src/swarm/util/schema";
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
            {columns.map((c) => (
              <th key={c.name}>
                <ColumnLabel column={c} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.unit.list.map((unit, i) => {
            const count0 = S.Session.unitCount0(session, unit.id);
            const poly = S.Session.unitPolynomial(session, unit.id);
            const count = S.Session.unitCount(session, unit.id, elapsed());
            const props = {
              unit,
              elapsed,
              session,
              setSession,
              count0,
              count,
              poly,
            };
            return <Unit key={unit.id} {...props} />;
          })}
        </tbody>
      </table>
    </div>
  );
}

interface UnitProps<I extends S.Schema.AnyID> {
  unit: S.Schema.Unit<I>;
  session: S.Session.Session<I>;
  setSession: React.Dispatch<React.SetStateAction<S.Session.Session<I>>>;
  elapsed: () => S.Session.ElapsedMs;
  // redundant/cached
  count: number;
  count0: number;
  poly: number[];
}
function Unit<I extends S.Schema.AnyID>(props: UnitProps<I>): JSX.Element {
  return (
    <tr key={props.unit.id}>
      {columns.map((c, i) =>
        i === 0 ? (
          <th key={c.name}>
            <c.element {...props} />
          </th>
        ) : (
          <td key={c.name}>
            <c.element {...props} />
          </td>
        )
      )}
    </tr>
  );
}

interface Column {
  name: string;
  label?: JSX.Element;
  element<I extends S.Schema.AnyID>(props: UnitProps<I>): JSX.Element;
}
const columns: readonly Column[] = [
  {
    name: "name",
    element(props) {
      return <>{props.unit.id}</>;
    },
  },
  {
    name: "count(0)",
    element(props) {
      const { unit, setSession, count0 } = props;
      return (
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
      );
    },
  },
  {
    name: "count",
    label: <>Count(t)</>,
    element(props) {
      const { count } = props;
      return (
        <input
          readOnly={true}
          type="number"
          style={style.readonlyInput}
          value={count.toPrecision(3)}
        />
      );
    },
  },
  {
    name: "produces",
    element(props) {
      const { unit } = props;
      return (
        <ul style={style.prodList}>
          {(unit.prod ?? []).map((prod) => (
            <li key={`${unit.id} -> ${prod.unit}`}>
              {prod.unit} &times;{prod.value}
            </li>
          ))}
        </ul>
      );
    },
  },
  {
    name: "prod rate",
    element(props) {
      const { session, unit, elapsed } = props;
      return (
        <>
          {S.Session.unitVelocity(session, unit.id, elapsed()).toPrecision(3)}/s
        </>
      );
    },
  },
  {
    name: "polynomial",
    element: ViewPolynomial,
  },
  {
    name: "degree",
    element(props) {
      return <>{S.Polynomial.degree(props.poly)}</>;
    },
  },
  {
    name: "cost",
    element(props) {
      const { unit, count0 } = props;
      return (
        <ul style={style.prodList}>
          {(unit.cost ?? []).map((cost) => (
            <li key={`${unit.id} $$ ${cost.unit}`}>
              {cost.unit} &times;
              {cost.value * (cost.factor ? Math.pow(cost.factor, count0) : 1)}
            </li>
          ))}
        </ul>
      );
    },
  },
  {
    name: "buyable",
    element(props) {
      const { unit, session, elapsed } = props;
      return (
        <ul style={style.prodList}>
          {(unit.cost ?? []).map((cost) => (
            <li key={`${unit.id} $$$ ${cost.unit}`}>
              {S.Session.costBuyable(session, cost, elapsed()).toPrecision(3)}{" "}
              buyable
            </li>
          ))}
        </ul>
      );
    },
  },
  {
    name: "buy rate",
    element(props) {
      const { unit, session, elapsed } = props;
      return (
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
      );
    },
  },
];

function ColumnLabel(props: { column: Column }): JSX.Element {
  const { column } = props;
  return (
    <th>
      {column.label ?? (
        <span style={{ textTransform: "capitalize" }}>{column.name}</span>
      )}
    </th>
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
