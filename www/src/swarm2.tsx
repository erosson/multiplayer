import React from "react";
import * as S from "shared/src/swarm";
import { omit } from "lodash";
import { keyBy } from "shared/src/swarm/util/schema";
import { ViewPolynomial, inputInt, inputFloat } from "./swarm";
import { AnyID } from "shared/src/swarm/schema";

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
  const [session, setSession] = React.useState(() => S.Session.empty(data));
  const [timeMs, setTimeMs] = React.useState(0);

  function elapsed() {
    return S.Duration.fromMillis(timeMs);
  }
  function now() {
    const d = S.Duration.fromMillis(timeMs);
    return S.Duration.dateAdd(session.session.reified, d);
  }
  function reify() {
    setSession((session) => {
      return omit(S.Session.reify({ ...session, now: now() }), "now");
    });
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
            const ctx = { ...session, unitId: unit.id, now: now() };
            const count0 = S.Session.Unit.count0(ctx);
            const poly = S.Session.Unit.polynomial(ctx);
            const count = S.Session.Unit.count(ctx);
            const props = {
              ctx,
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
  ctx: S.Session.Unit.SnapshotCtx<I>;
  unit: S.Schema.Unit<I>;
  session: S.Session.Ctx<I>;
  setSession: React.Dispatch<React.SetStateAction<S.Session.Ctx<I>>>;
  elapsed: () => S.Duration.T;
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
      const { ctx, count0, setSession } = props;
      return (
        <input
          type="number"
          style={style.input}
          value={count0}
          onInput={(e) => {
            const value = e.currentTarget.value;
            setSession(
              S.Session.Unit.set(ctx, {
                ...S.Session.Unit.get(ctx),
                count: inputInt(value ?? "", count0),
              })
              // TODO why does type inference not work right here?
              // S.Session.Unit.map(ctx, (u, x) => ({
              // ...u,
              // count: inputInt(value ?? "", count0),
              // }))
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
      return (
        <>
          {S.Session.Unit.velocity(props.ctx).toPrecision(3)}
          /s
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
      return (
        <ul style={style.prodList}>
          {S.Session.Unit.costBuyable(props.ctx)?.map((res) => (
            <li key={`${props.ctx.unitId} $$ ${res.cost.unit}`}>
              {res.buyable.toPrecision(3)}
            </li>
          ))}
        </ul>
      );
    },
  },
  {
    name: "buy rate",
    element(props) {
      return (
        <ul style={style.prodList}>
          {S.Session.Unit.costBuyableVelocity(props.ctx)?.map((res) => (
            <li key={`${props.ctx.unitId} v$$ ${res.cost.unit}`}>
              {res.velocity.toPrecision(3)}/s
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
